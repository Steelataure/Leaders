package esiea.hackathon.leaders.usecase;

import esiea.hackathon.leaders.application.services.GameSetupService;
import esiea.hackathon.leaders.domain.Session;
import esiea.hackathon.leaders.domain.SessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.Optional;
import java.util.UUID;

@RequiredArgsConstructor
public class MatchmakingUseCase {
    private final SessionRepository sessionRepository;
    private final CreateGameSessionUseCase createGameSessionUseCase;
    private final ConnectPlayerUseCase connectPlayerUseCase;
    private final GameSetupService gameSetupService;
    private final SimpMessagingTemplate messagingTemplate;

    // Global lock for matchmaking to prevent multiple players from joining the same
    // session simultaneously
    private static final Object GLOBAL_MATCHMAKING_LOCK = new Object();

    public Session findOrCreatePublicSession(String playerId) {
        synchronized (GLOBAL_MATCHMAKING_LOCK) {

            System.out.println("DEBUG: Matchmaking request for player: " + playerId);

            // 0. Check if player is already in a session
            // This prevents creating a second session if the first request succeeded
            // locally but the frontend retried
            // 0. Only rejoin if in a WAITING session (handles UI retries/page refresh while
            // in queue)
            // If the session is ACTIVE, we allow the player to find a NEW match
            // unless they specifically want to reconnect (handled by another logic)
            Optional<Session> currentSession = sessionRepository.findAll().stream()
                    .filter(s -> s != null && s.getPlayer1() != null)
                    .filter(s -> (s.getPlayer1().getId() != null && s.getPlayer1().getId().equals(playerId))
                            || (s.getPlayer2() != null && s.getPlayer2().getId() != null
                                    && s.getPlayer2().getId().equals(playerId)))
                    .filter(s -> s.getStatus() == Session.SessionStatus.WAITING_FOR_PLAYER)
                    .findFirst();

            if (currentSession.isPresent()) {
                System.out.println("DEBUG: Player " + playerId + " already in session " + currentSession.get().getId());
                return currentSession.get();
            }

            System.out.println("DEBUG: Player " + playerId + " not in any session. Proceeding to find/create.");

            int maxRetries = 3;
            for (int i = 0; i < maxRetries; i++) {
                try {
                    // 1. Try to find a waiting public session excluding self
                    Optional<Session> existingSession = sessionRepository.findSuitableSession(playerId);

                    if (existingSession.isPresent()) {
                        System.out.println("DEBUG: Found suitable session " + existingSession.get().getId()
                                + " for player " + playerId);
                        // 2. Join it
                        return connectPlayerUseCase.connect(existingSession.get().getId(), playerId);
                    } else {
                        // 3. Create a new public session
                        System.out.println("DEBUG: No suitable session found. Creating new one for player " + playerId);
                        return createGameSessionUseCase.createSession(false, playerId);
                    }
                } catch (Exception e) {
                    System.err.println("CRITICAL Matchmaking error during attempt " + i + ": " + e.getMessage());
                    e.printStackTrace();

                    if (e instanceof org.springframework.orm.ObjectOptimisticLockingFailureException) {
                        System.out.println("DEBUG: Optimistic locking failure. Retrying...");
                    } else {
                        throw new RuntimeException("Matchmaking failed: " + e.getMessage(), e);
                    }

                    // Re-check if player actually joined despite the exception
                    Optional<Session> recheckSession = sessionRepository.findAll().stream()
                            .filter(s -> s != null && s.getPlayer1() != null)
                            .filter(s -> (s.getPlayer1().getId() != null && s.getPlayer1().getId().equals(playerId))
                                    || (s.getPlayer2() != null && s.getPlayer2().getId() != null
                                            && s.getPlayer2().getId().equals(playerId)))
                            .filter(s -> s.getStatus() == Session.SessionStatus.WAITING_FOR_PLAYER
                                    || s.getStatus() == Session.SessionStatus.ACTIVE)
                            .findFirst();

                    if (recheckSession.isPresent()) {
                        Session session = recheckSession.get();
                        System.out.println("DEBUG: Player " + playerId + " actually joined session "
                                + session.getId() + " despite exception");

                        // IMPORTANT: If session is ACTIVE, we need to create the game!
                        if (session.getStatus() == Session.SessionStatus.ACTIVE) {
                            System.out.println("DEBUG: Session is ACTIVE, checking if game exists...");
                            try {
                                // Try to create the game - it might already exist
                                UUID gameId = java.util.UUID.fromString(session.getId());
                                gameSetupService.createGameWithId(gameId, null, null);
                                System.out.println("DEBUG: Game created for session " + session.getId());

                                // FIX: Notification manquante dans le cas de récupération (Bug Synchronisation
                                // Matchmaking)
                                // On s'assure que le créateur et le joigneur reçoivent l'événement
                                try {
                                    // 1. Notifier Lobby
                                    messagingTemplate.convertAndSend("/topic/session/" + session.getId(), session);

                                    // 2. Notifier Game avec l'état actuel (si possible)
                                    // Note: On utilise connectPlayerUseCase ou autowiré messagingTemplate ?
                                    // MatchmakingUseCase n'a pas messagingTemplate par défaut ? Vérifions...
                                } catch (Exception e_ws) {
                                    System.err.println(
                                            "WARN: Could not send recovery WS notification: " + e_ws.getMessage());
                                }

                            } catch (Exception gameEx) {
                                // Game might already exist, that's okay
                                System.out.println(
                                        "DEBUG: Game creation failed (might already exist): " + gameEx.getMessage());
                            }
                        }

                        return session;
                    }

                    // Retry if optimistic locking failure occurs
                    if (i == maxRetries - 1) {
                        throw e;
                    }
                    try {
                        Thread.sleep(100); // Small delay to reduce contention
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException(ie);
                    }
                }
            }
            throw new RuntimeException("Failed to join or create a session after retries");
        }
    }

    public void removePlayerFromQueue(String playerId) {
        synchronized (GLOBAL_MATCHMAKING_LOCK) {
            System.out.println("DEBUG: Removing player " + playerId + " from queue");
            sessionRepository.findAll().stream()
                    .filter(s -> s.getStatus() == Session.SessionStatus.WAITING_FOR_PLAYER)
                    .filter(s -> s.getPlayer1() != null && s.getPlayer1().getId().equals(playerId))
                    .findFirst()
                    .ifPresent(session -> {
                        System.out.println("DEBUG: Found waiting session " + session.getId() + " for player " + playerId
                                + ". Marking as FINISHED (cancelled).");
                        session.finish();
                        // Note: In a real DB we would delete it, but marking as FINISHED is safer for
                        // in-memory
                        // to avoid concurrent modification issues if we tried to remove from the map
                        // directly
                        // without a repository delete method.
                        // Actually sessionRepository has no delete.
                        // Marking as FINISHED effectively removes it from "WAITING_FOR_PLAYER" queries.
                    });
        }
    }
}
