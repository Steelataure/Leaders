package esiea.hackathon.leaders.usecase;

import esiea.hackathon.leaders.domain.Player;
import esiea.hackathon.leaders.domain.Session;
import esiea.hackathon.leaders.domain.SessionRepository;
import esiea.hackathon.leaders.application.dto.response.GameStateDto;
import esiea.hackathon.leaders.application.services.GameQueryService;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import java.util.UUID;
import java.util.Optional;

public class ConnectPlayerUseCase {
    private final SessionRepository sessionRepository;
    private final esiea.hackathon.leaders.application.services.GameSetupService gameSetupService;
    private final GameQueryService gameQueryService;
    private final SimpMessagingTemplate messagingTemplate;

    public ConnectPlayerUseCase(SessionRepository sessionRepository,
            esiea.hackathon.leaders.application.services.GameSetupService gameSetupService,
            GameQueryService gameQueryService,
            SimpMessagingTemplate messagingTemplate) {
        this.sessionRepository = sessionRepository;
        this.gameSetupService = gameSetupService;
        this.gameQueryService = gameQueryService;
        this.messagingTemplate = messagingTemplate;
    }

    public Session connect(String sessionId, String playerId) {
        Optional<Session> sessionOpt = sessionRepository.findById(sessionId);

        if (sessionOpt.isEmpty()) {
            throw new IllegalArgumentException("Session not found: " + sessionId);
        }

        Session session = sessionOpt.get();
        // Use provided playerId or generate new one
        String actualPlayerId = (playerId != null) ? playerId : UUID.randomUUID().toString();
        Player player2 = new Player(actualPlayerId);

        session.join(player2);
        sessionRepository.save(session);

        System.out.println("DEBUG: Session status after join: " + session.getStatus());
        if (session.getStatus() == Session.SessionStatus.ACTIVE) {
            System.out.println("DEBUG: Creating game with ID: " + session.getId());
            UUID gameId = UUID.fromString(session.getId());
            gameSetupService.createGameWithId(gameId, null);
            System.out.println("DEBUG: Game created successfully!");

            // Send game state via WebSocket
            try {
                GameStateDto gameState = gameQueryService.getGameState(gameId);
                messagingTemplate.convertAndSend("/topic/session/" + session.getId(), gameState);
                System.out.println("DEBUG: Game state sent via WebSocket to /topic/session/" + session.getId());
            } catch (Exception e) {
                System.err.println("ERROR: Failed to send game state via WebSocket: " + e.getMessage());
            }
        } else {
            System.out.println("DEBUG: Session not ACTIVE, status is: " + session.getStatus());
        }

        return session;
    }
}
