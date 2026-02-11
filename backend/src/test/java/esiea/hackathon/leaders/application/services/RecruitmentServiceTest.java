package esiea.hackathon.leaders.application.services;

import esiea.hackathon.leaders.domain.model.GameEntity;
import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import esiea.hackathon.leaders.domain.model.RecruitmentCardEntity;
import esiea.hackathon.leaders.domain.model.RefCharacterEntity;
import esiea.hackathon.leaders.domain.model.enums.CardState;
import esiea.hackathon.leaders.domain.repository.GameRepository;
import esiea.hackathon.leaders.domain.repository.PieceRepository;
import esiea.hackathon.leaders.domain.repository.RecruitmentCardRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

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
        @Mock
        private GameService gameService;

        private final UUID gameId = UUID.randomUUID();
        private final UUID cardId = UUID.randomUUID();
        private GameEntity game;
        private RecruitmentCardEntity card;
        private RefCharacterEntity character;

        @BeforeEach
        void setUp() {
                game = GameEntity.builder()
                                .id(gameId)
                                .currentPlayerIndex(0)
                                .turnNumber(1)
                                .recruitmentCount(0)
                                .players(new ArrayList<>())
                                .build();

                character = mock(RefCharacterEntity.class);
                when(character.getId()).thenReturn("ARCHER");

                card = RecruitmentCardEntity.builder()
                                .id(cardId)
                                .game(game)
                                .character(character)
                                .state(CardState.VISIBLE)
                                .visibleSlot(1)
                                .build();

                when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));
                when(cardRepository.findById(cardId)).thenReturn(Optional.of(card));
        }

        @Test
        @DisplayName("Recrutement autorisé avec 4 unités existantes (total d'unités = 4 + 1 = 5)")
        void recruit_With4Units_Success() {
                // Mock pieces: 1 Leader (acted!) + 4 units (acted!)
                List<PieceEntity> pieces = new ArrayList<>();
                pieces.add(PieceEntity.builder().characterId("LEADER").ownerIndex((short) 0).hasActedThisTurn(true)
                                .q((short) 0)
                                .r((short) 0).build());
                for (int i = 0; i < 4; i++) {
                        pieces.add(PieceEntity.builder().characterId("ARCHER").ownerIndex((short) 0)
                                        .hasActedThisTurn(true)
                                        .q((short) 10).r((short) 10).build());
                }

                when(pieceRepository.findByGameId(gameId)).thenReturn(pieces);
                when(pieceRepository.findByGameIdAndPosition(any(), anyShort(), anyShort()))
                                .thenReturn(Optional.empty());

                List<HexCoord> placements = List.of(new HexCoord((short) 0, (short) 3)); // Zone valide pour P0

                assertDoesNotThrow(() -> recruitmentService.recruit(gameId, (short) 0, cardId, placements));
        }

        @Test
        @DisplayName("Recrutement bloqué avec 5 unités existantes (total d'unités = 5 + 1 = 6)")
        void recruit_With5Units_ThrowsException() {
                // Mock pieces: 1 Leader (acted!) + 5 units (acted!)
                List<PieceEntity> pieces = new ArrayList<>();
                pieces.add(PieceEntity.builder().characterId("LEADER").ownerIndex((short) 0).hasActedThisTurn(true)
                                .q((short) 0)
                                .r((short) 0).build());
                for (int i = 0; i < 5; i++) {
                        pieces.add(PieceEntity.builder().characterId("ARCHER").ownerIndex((short) 0)
                                        .hasActedThisTurn(true)
                                        .q((short) 10).r((short) 10).build());
                }

                when(pieceRepository.findByGameId(gameId)).thenReturn(pieces);

                List<HexCoord> placements = List.of(new HexCoord((short) 0, (short) 3));

                IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                                () -> recruitmentService.recruit(gameId, (short) 0, cardId, placements));

                assertTrue(exception.getMessage().contains("You cannot exceed the limit of 5 units"));
                assertTrue(exception.getMessage().contains("Current units found: ["));
        }

        private void assertTrue(boolean condition) {
                if (!condition)
                        throw new AssertionError("Condition should be true");
        }
}
