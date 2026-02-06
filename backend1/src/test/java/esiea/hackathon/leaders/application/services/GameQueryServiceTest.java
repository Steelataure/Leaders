package esiea.hackathon.leaders.application.services;

import esiea.hackathon.leaders.application.dto.response.GameStateDto;
import esiea.hackathon.leaders.domain.model.GameEntity;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import esiea.hackathon.leaders.domain.model.RecruitmentCardEntity;
import esiea.hackathon.leaders.domain.model.RefCharacterEntity;
import esiea.hackathon.leaders.domain.model.enums.CardState;
import esiea.hackathon.leaders.domain.model.enums.GamePhase;
import esiea.hackathon.leaders.domain.model.enums.GameStatus;
import esiea.hackathon.leaders.domain.repository.GameRepository;
import esiea.hackathon.leaders.domain.repository.PieceRepository;
import esiea.hackathon.leaders.domain.repository.RecruitmentCardRepository;
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
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GameQueryServiceTest {

    @InjectMocks
    private GameQueryService gameQueryService;

    @Mock
    private PieceRepository pieceRepository;
    @Mock
    private GameRepository gameRepository;
    @Mock
    private RecruitmentCardRepository cardRepository;

    private final UUID gameId = UUID.randomUUID();
    private final UUID pieceId = UUID.randomUUID();


    @Test
    @DisplayName("Check du status correct du jeu")
    void getGameState_ok() {
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
        PieceEntity piece = PieceEntity.builder()
                .id(pieceId)
                .characterId("BRAWLER")
                .ownerIndex((short) 0)
                .q((short) 0)
                .r((short) 0)
                .hasActedThisTurn(false)
                .build()
        ;
        // Carte
        RefCharacterEntity character = RefCharacterEntity.builder()
                .id("BRAWLER")
                .build()
        ;
        RecruitmentCardEntity visibleCard = RecruitmentCardEntity.builder()
                .id(UUID.randomUUID())
                .character(character)
                .state(CardState.VISIBLE)
                .visibleSlot(0)
                .build()
        ;
        RecruitmentCardEntity inDeckCard = RecruitmentCardEntity.builder()
                .id(UUID.randomUUID())
                .state(CardState.IN_DECK)
                .build()
        ;
        when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));
        when(pieceRepository.findByGameId(gameId)).thenReturn(List.of(piece));
        when(cardRepository.findAllByGameId(gameId))
                .thenReturn(List.of(visibleCard, inDeckCard));

        GameStateDto result = gameQueryService.getGameState(gameId);

        assertThat(result).isNotNull();
        assertThat(result.gameId()).isEqualTo(gameId);
        assertThat(result.turnNumber()).isEqualTo(3);
        assertThat(result.pieces().get(0).characterId()).isEqualTo("BRAWLER");
        assertThat(result.river()).hasSize(1);



    }

}