package esiea.hackathon.leaders.usecase;

import esiea.hackathon.leaders.domain.Session;
import esiea.hackathon.leaders.domain.SessionRepository;

import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

public class MatchmakingUseCase {
    private final SessionRepository sessionRepository;
    private final CreateGameSessionUseCase createGameSessionUseCase;
    private final ConnectPlayerUseCase connectPlayerUseCase;

    // Lock map to prevent race conditions for the same player
    private final ConcurrentHashMap<String, Object> playerLocks = new ConcurrentHashMap<>();

    public MatchmakingUseCase(SessionRepository sessionRepository,
            CreateGameSessionUseCase createGameSessionUseCase,
            ConnectPlayerUseCase connectPlayerUseCase) {
        this.sessionRepository = sessionRepository;
        this.createGameSessionUseCase = createGameSessionUseCase;
        this.connectPlayerUseCase = connectPlayerUseCase;
    }

    public Session findOrCreatePublicSession(String playerId) {
        // Synchronize on player ID to ensure sequential processing of requests
        Object lock = playerLocks.computeIfAbsent(playerId, k -> new Object());

        synchronized (lock) {
            System.out.println("DEBUG: Matchmaking request for player: " + playerId);

            // 0. Check if player is already in a session
            // This prevents creating a second session if the first request succeeded
            // locally but the frontend retried
            Optional<Session> currentSession = sessionRepository.findAll().stream()
                    .filter(s -> s.getPlayer1().getId().equals(playerId)
                            || (s.getPlayer2() != null && s.getPlayer2().getId().equals(playerId)))
                    .filter(s -> s.getStatus() == Session.SessionStatus.WAITING_FOR_PLAYER
                            || s.getStatus() == Session.SessionStatus.ACTIVE)
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
                } catch (org.springframework.orm.ObjectOptimisticLockingFailureException e) {
                    System.out.println("DEBUG: Optimistic locking failure. Retrying...");

                    // Re-check if player actually joined despite the exception
                    Optional<Session> recheckSession = sessionRepository.findAll().stream()
                            .filter(s -> s.getPlayer1().getId().equals(playerId)
                                    || (s.getPlayer2() != null && s.getPlayer2().getId().equals(playerId)))
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
                                gameSetupService.createGameWithId(java.util.UUID.fromString(session.getId()), null);
                                System.out.println("DEBUG: Game created for session " + session.getId());
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
}
