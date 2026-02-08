package esiea.hackathon.leaders;

import esiea.hackathon.leaders.domain.model.GameEntity;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import esiea.hackathon.leaders.domain.repository.GameRepository;
import esiea.hackathon.leaders.domain.repository.PieceRepository;
import esiea.hackathon.leaders.adapter.controller.PieceController;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.test.context.ActiveProfiles;
import esiea.hackathon.leaders.domain.model.enums.GameStatus;
import esiea.hackathon.leaders.domain.model.enums.GameMode;
import esiea.hackathon.leaders.domain.model.enums.GamePhase;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.mock;

@SpringBootTest
@ActiveProfiles("test")
class ReproduceGameMoveIT {

    @Autowired
    private PieceController pieceController;

    @Autowired
    private PieceRepository pieceRepository;

    @Autowired
    private GameRepository gameRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @TestConfiguration
    static class TestConfig {
        @Bean
        @Primary
        public SimpMessagingTemplate simpMessagingTemplate() {
            return mock(SimpMessagingTemplate.class);
        }
    }

    @Test
    void movePiece_ShouldBroadcastUpdate() {
        // 1. Setup Game and Piece
        UUID gameId = UUID.randomUUID();
        GameEntity game = GameEntity.builder()
                .id(gameId)
                .status(GameStatus.IN_PROGRESS)
                .mode(GameMode.CLASSIC)
                .phase(GamePhase.ACTION)
                .currentPlayerIndex(0)
                .turnNumber(1)
                .banishmentCount(0)
                .build();
        gameRepository.save(game);

        PieceEntity piece = PieceEntity.builder()
                .gameId(gameId)
                .characterId("ARCHER")
                .ownerIndex((short) 0)
                .q((short) 0)
                .r((short) 0)
                .hasActedThisTurn(false)
                .build();
        PieceEntity savedPiece = pieceRepository.save(piece);

        // 2. Tenter de bouger une pièce (on suppose qu'on connait son ID, ou on le
        // récupère via API)
        PieceController.MoveRequest moveRequest = new PieceController.MoveRequest((short) 0, (short) 1,
                UUID.randomUUID());
        pieceController.movePiece(savedPiece.getId(), moveRequest);

        // 3. Verify Websocket Broadcast
        verify(messagingTemplate).convertAndSend(eq("/topic/game/" + gameId), any(Object.class));
    }
}
