package esiea.hackathon.leaders.application.services;

import esiea.hackathon.leaders.domain.model.*;
import esiea.hackathon.leaders.domain.model.enums.CardState;
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

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyShort;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RecruitmentServiceTest {

    @InjectMocks
    private RecruitmentService recruitmentService;

    @Mock
    private RecruitmentCardRepository cardRepository;
    @Mock
    private PieceRepository pieceRepository;
    @Mock
    private GameRepository gameRepository;
    private GameEntity game;

    @Test
    @DisplayName("Recruit - Mauvais Tour de Joueur pour Piocher")
    void recruit_wrongPlayer() {
        UUID gameId = UUID.randomUUID();
        UUID pieceId = UUID.randomUUID();
        game = GameEntity.builder()
                .id(gameId)
                .currentPlayerIndex(0)
                .build()
        ;
        // 1. Mocks Repositories
        when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));
        assertThrows(IllegalStateException.class, () ->
                recruitmentService.recruit(gameId, (short)1, pieceId,  List.of())
        );
    }

    @Test
    @DisplayName("Recruit - Carte inexistante dans le jeu")
    void recruit_nonExistent() {
        UUID gameId = UUID.randomUUID();
        UUID pieceId = UUID.randomUUID();
        game = GameEntity.builder()
                .id(gameId)
                .currentPlayerIndex(1)
                .build()
        ;
        // 1. Mocks Repositories
        when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));
        when(cardRepository.findById(pieceId)).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () ->
                recruitmentService.recruit(gameId, (short)1, pieceId,  List.of(new HexCoord((short)0, (short)0)))
        );
    }

    @Test
    @DisplayName("Recruit - Carte non visible dans la river ")
    void recruit_nonVisible() {
        UUID gameId = UUID.randomUUID();
        UUID pieceId = UUID.randomUUID();
        game = GameEntity.builder()
                .id(gameId)
                .currentPlayerIndex(0)
                .build()
        ;
        RecruitmentCardEntity nonVsibleCard = RecruitmentCardEntity.builder()
                .id(pieceId)
                .game(game)
                .state(CardState.IN_DECK)
                .build()
        ;
        // 1. Mocks Repositories
        when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));
        when(cardRepository.findById(pieceId)).thenReturn(Optional.of(nonVsibleCard));

        assertThrows(IllegalArgumentException.class, () ->
                recruitmentService.recruit(gameId, (short)0, pieceId,  List.of(new HexCoord((short)0, (short)0)))
        );
    }

    @Test
    @DisplayName("Recruit - 5 Carte + Ajout d'une carte : Limite de 5 unité depassé")
    void recruit_limitExceeded() {
        UUID gameId = UUID.randomUUID();
        UUID pieceId = UUID.randomUUID();
        // Game
        game = GameEntity.builder()
                .id(gameId)
                .currentPlayerIndex(0)
                .build()
        ;
        // Carte
        RefCharacterEntity character = RefCharacterEntity.builder()
                .id("BRAWLER")
                .build()
        ;
        RecruitmentCardEntity card = RecruitmentCardEntity.builder()
                .id(pieceId)
                .game(game)
                .state(CardState.VISIBLE)
                .character(character)
                .visibleSlot(1)
                .build()
        ;
        // Le joueur a deja 5 piece sur le jeu
        List<PieceEntity> currentPiece = List.of(
                PieceEntity.builder().ownerIndex((short) 0).build(),
                PieceEntity.builder().ownerIndex((short) 0).build(),
                PieceEntity.builder().ownerIndex((short) 0).build(),
                PieceEntity.builder().ownerIndex((short) 0).build(),
                PieceEntity.builder().ownerIndex((short) 0).build()
        );
        // 1. Mocks Repositories
        when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));
        when(cardRepository.findById(pieceId)).thenReturn(Optional.of(card));
        when(pieceRepository.findByGameId(gameId)).thenReturn(currentPiece);

        assertThrows(IllegalArgumentException.class, () ->
                recruitmentService.recruit(gameId, (short)0, pieceId,  List.of(new HexCoord((short)0, (short)0)))
        );
    }

    @Test
    @DisplayName("Recruit - 4 Carte + Ajout d'un OLD_BEAR : Limite de 5 unité depassé")
    void recruit_limitExceededBear() {
        UUID gameId = UUID.randomUUID();
        UUID pieceId = UUID.randomUUID();
        // Game
        game = GameEntity.builder()
                .id(gameId)
                .currentPlayerIndex(0)
                .build()
        ;
        // Carte
        RefCharacterEntity character = RefCharacterEntity.builder()
                .id("OLD_BEAR")
                .build()
        ;
        RecruitmentCardEntity card = RecruitmentCardEntity.builder()
                .id(pieceId)
                .game(game)
                .state(CardState.VISIBLE)
                .character(character)
                .visibleSlot(1)
                .build()
                ;
        // Le joueur a deja 5 piece sur le jeu
        List<PieceEntity> currentPiece = List.of(
                PieceEntity.builder().ownerIndex((short) 0).build(),
                PieceEntity.builder().ownerIndex((short) 0).build(),
                PieceEntity.builder().ownerIndex((short) 0).build(),
                PieceEntity.builder().ownerIndex((short) 0).build()
        );
        // 1. Mocks Repositories
        when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));
        when(cardRepository.findById(pieceId)).thenReturn(Optional.of(card));
        when(pieceRepository.findByGameId(gameId)).thenReturn(currentPiece);

        assertThrows(IllegalArgumentException.class, () ->
                recruitmentService.recruit(gameId, (short)0, pieceId,  List.of(new HexCoord((short)0, (short)0)))
        );
    }

    @Test
    @DisplayName("Recruit - Un Ours vient avec son Ourson")
    void recruit_bearComeWithCup() {
        UUID gameId = UUID.randomUUID();
        UUID pieceId = UUID.randomUUID();
        // Game
        game = GameEntity.builder()
                .id(gameId)
                .currentPlayerIndex(0)
                .build()
        ;
        // Carte
        RefCharacterEntity character = RefCharacterEntity.builder()
                .id("OLD_BEAR")
                .build()
        ;
        RecruitmentCardEntity card = RecruitmentCardEntity.builder()
                .id(pieceId)
                .game(game)
                .state(CardState.VISIBLE)
                .character(character)
                .visibleSlot(1)
                .build()
        ;
        // 2 Emplacements
        HexCoord p1 = new HexCoord((short) 0, (short) 0);
        HexCoord p2 = new HexCoord((short) 1, (short) 0);

        // 1. Mocks Repositories
        when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));
        when(cardRepository.findById(pieceId)).thenReturn(Optional.of(card));
        when(pieceRepository.findByGameId(gameId)).thenReturn(List.of());
        when(pieceRepository.findByGameIdAndPosition(any(), anyShort(), anyShort()))
                .thenReturn(Optional.empty());
        when(pieceRepository.save(any(PieceEntity.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        List<PieceEntity> result = recruitmentService.recruit(
                gameId,
                (short) 0,
                pieceId,
                List.of(p1, p2)
        );

        assertEquals(2, result.size());
        assertEquals("OLD_BEAR", result.get(0).getCharacterId());
        assertEquals("CUB", result.get(1).getCharacterId());
    }

}