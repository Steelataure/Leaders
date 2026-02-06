package esiea.hackathon.leaders.application.services;

import esiea.hackathon.leaders.domain.model.*;
import esiea.hackathon.leaders.domain.model.enums.*;
import esiea.hackathon.leaders.domain.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;


@ExtendWith(MockitoExtension.class)
class GameSetupServiceTest {

    @InjectMocks
    GameSetupService gameSetupService;

    @Mock
    private GameRepository gameRepository;
    @Mock
    private RefCharacterRepository characterRepository;
    @Mock
    private RecruitmentCardRepository cardRepository;
    @Mock
    private PieceRepository pieceRepository;

    UUID gameId = UUID.randomUUID();
    GameEntity game;

    @BeforeEach
    void setUp() {
        // Game
        game = GameEntity.builder()
                .id(gameId)
                .mode(GameMode.CLASSIC)
                .phase(GamePhase.ACTION)
                .status(GameStatus.WAITING)
                .currentPlayerIndex(0)
                .turnNumber(1)
                .banishmentCount(0)
                .build()
        ;
        when(gameRepository.save(any(GameEntity.class))).thenReturn(game);

        // Liste complète de tous les personnages du jeu
        List<String> allChars = List.of(
                "ACROBAT", "ARCHER", "ASSASSIN", "BRAWLER", "CAVALRY",
                "GRAPPLER", "ILLUSIONIST", "INNKEEPER", "JAILER",
                "MANIPULATOR", "NEMESIS", "OLD_BEAR", "PROTECTOR",
                "PROWLER", "ROYAL_GUARD", "VIZIER"
        );

        for (String id : allChars) {
            when(characterRepository.findById(id))
                    .thenReturn(Optional.of(
                            RefCharacterEntity.builder().id(id).build()
                    ));
        }
    }

    @Test
    @DisplayName("Creation d'une Game - Scenario Standard")
    void createGame_standard() {
        UUID result = gameSetupService.createGame(null);
        assertEquals(gameId, result);
    }

    @Test
    @DisplayName("Initialisation d'un Deck - Carte Force")
    void initializeDeck_forcedDeck() {
        List<String> forcedDeck = List.of("ASSASSIN", "BRAWLER", "ARCHER");
        UUID result = gameSetupService.createGame(forcedDeck);

        ArgumentCaptor<RecruitmentCardEntity> captor =
                ArgumentCaptor.forClass(RecruitmentCardEntity.class);
        verify(cardRepository, atLeastOnce()).save(captor.capture());
        List<RecruitmentCardEntity> cards = captor.getAllValues();

        assertEquals("ASSASSIN", cards.get(0).getCharacter().getId());
        assertEquals("BRAWLER", cards.get(1).getCharacter().getId());
        assertEquals("ARCHER", cards.get(2).getCharacter().getId());
    }

    @Test
    @DisplayName("Initialisation d'un Deck - Caractère Inconnu")
    void createGame_characterUnknown() {
        // Liste incomplète de tous les personnages du jeu
        List<String> notAllChars = List.of(
                "ACROBAT", "ARCHER", "BRAWLER",
                "THIEF"
        );

        assertThrows(RuntimeException.class, () ->
                gameSetupService.createGame(notAllChars)
        );
    }


}