package esiea.hackathon.leaders.application.services;

import esiea.hackathon.leaders.domain.model.GameEntity;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import esiea.hackathon.leaders.domain.model.enums.GamePhase;
import esiea.hackathon.leaders.domain.model.enums.GameStatus;
import esiea.hackathon.leaders.domain.repository.GameRepository;
import esiea.hackathon.leaders.domain.repository.PieceRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GameServiceTest {

    @InjectMocks
    private GameService gameService;

    @Mock
    private GameRepository gameRepository;
    @Mock
    private PieceRepository pieceRepository;
    @Mock
    private VictoryService victoryService;

    private final UUID gameId = UUID.randomUUID();

    @Test
    @DisplayName("Check du comportements standard en fin de tour")
    void endTurn() {
        // Game
        GameEntity game = GameEntity.builder()
                .id(gameId)
                .status(GameStatus.IN_PROGRESS)
                .phase(GamePhase.ACTION)
                .currentPlayerIndex(0)
                .turnNumber(3)
                .build()
        ;

        // Pièce
        PieceEntity piecePlayed = PieceEntity.builder()
                .id(UUID.randomUUID())
                .gameId(gameId)
                .hasActedThisTurn(true)
                .build()
        ;
        PieceEntity pieceNotPlayed = PieceEntity.builder()
                .id(UUID.randomUUID())
                .gameId(gameId)
                .hasActedThisTurn(false)
                .build()
        ;
        when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));
        when(pieceRepository.findByGameId(gameId)).thenReturn(List.of(piecePlayed, pieceNotPlayed));

        gameService.endTurn(gameId);

        assertThat(game.getCurrentPlayerIndex()).isEqualTo((short) 1);
        assertThat(game.getTurnNumber()).isEqualTo(4);
        assertThat(piecePlayed.getHasActedThisTurn()).isFalse();
        verify(gameRepository).save(game);
    }
}