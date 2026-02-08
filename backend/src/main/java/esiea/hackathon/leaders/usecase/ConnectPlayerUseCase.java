package esiea.hackathon.leaders.usecase;

import esiea.hackathon.leaders.domain.Player;
import esiea.hackathon.leaders.domain.Session;
import esiea.hackathon.leaders.domain.SessionRepository;
import esiea.hackathon.leaders.application.dto.response.GameStateDto;
import esiea.hackathon.leaders.application.services.GameQueryService;
import esiea.hackathon.leaders.adapter.infrastructure.entity.GameJpaEntity;
import esiea.hackathon.leaders.adapter.infrastructure.entity.GamePlayerJpaEntity;
import esiea.hackathon.leaders.adapter.infrastructure.repository.SpringGamePlayerRepository;
import esiea.hackathon.leaders.adapter.infrastructure.repository.SpringGameRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import java.util.UUID;
import java.util.Optional;

public class ConnectPlayerUseCase {
    private final SessionRepository sessionRepository;
    private final esiea.hackathon.leaders.application.services.GameSetupService gameSetupService;
    private final GameQueryService gameQueryService;
    private final SimpMessagingTemplate messagingTemplate;
    private final SpringGamePlayerRepository gamePlayerRepository;
    private final SpringGameRepository springGameRepository;

    public ConnectPlayerUseCase(SessionRepository sessionRepository,
            esiea.hackathon.leaders.application.services.GameSetupService gameSetupService,
            GameQueryService gameQueryService,
            SimpMessagingTemplate messagingTemplate,
            SpringGamePlayerRepository gamePlayerRepository,
            SpringGameRepository springGameRepository) {
        this.sessionRepository = sessionRepository;
        this.gameSetupService = gameSetupService;
        this.gameQueryService = gameQueryService;
        this.messagingTemplate = messagingTemplate;
        this.gamePlayerRepository = gamePlayerRepository;
        this.springGameRepository = springGameRepository;
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

            // Save players to game_player table
            try {
                GameJpaEntity gameRef = springGameRepository.findById(gameId)
                        .orElseThrow(() -> new RuntimeException("Game not found after creation"));

                // Player 1 (host)
                if (session.getPlayer1() != null) {
                    UUID player1Id = UUID.fromString(session.getPlayer1().getId());
                    GamePlayerJpaEntity gp1 = GamePlayerJpaEntity.builder()
                            .game(gameRef)
                            .userId(player1Id)
                            .playerIndex(0)
                            .isFirstTurnCompleted(false)
                            .build();
                    gamePlayerRepository.save(gp1);
                    System.out.println("DEBUG: Saved player 0 with userId: " + player1Id);
                }

                // Player 2 (joiner)
                UUID player2Id = UUID.fromString(actualPlayerId);
                GamePlayerJpaEntity gp2 = GamePlayerJpaEntity.builder()
                        .game(gameRef)
                        .userId(player2Id)
                        .playerIndex(1)
                        .isFirstTurnCompleted(false)
                        .build();
                gamePlayerRepository.save(gp2);
                System.out.println("DEBUG: Saved player 1 with userId: " + player2Id);

            } catch (Exception e) {
                System.err.println("ERROR: Failed to save game players: " + e.getMessage());
                e.printStackTrace();
            }

            // Send game state via WebSocket
            try {
                // 1. Notify Lobby that session is ACTIVE
                messagingTemplate.convertAndSend("/topic/session/" + session.getId(), session);
                System.out.println("DEBUG: Session update sent via WebSocket to /topic/session/" + session.getId());

                // 2. Notify Game components with initial state
                GameStateDto gameState = gameQueryService.getGameState(gameId);
                messagingTemplate.convertAndSend("/topic/game/" + session.getId(), gameState);
                System.out.println("DEBUG: Game state sent via WebSocket to /topic/game/" + session.getId());
            } catch (Exception e) {
                System.err.println("ERROR: Failed to send game state via WebSocket: " + e.getMessage());
            }
        } else {
            System.out.println("DEBUG: Session not ACTIVE, status is: " + session.getStatus());
        }

        return session;
    }
}
