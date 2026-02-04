package esiea.hackathon.leaders.application.services;

import esiea.hackathon.leaders.application.strategies.ActionAbilityStrategy;
import esiea.hackathon.leaders.application.strategies.action.ActionFactory;
import esiea.hackathon.leaders.domain.model.AbilityEntity;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import esiea.hackathon.leaders.domain.model.RefCharacterEntity;
import esiea.hackathon.leaders.domain.repository.PieceRepository;
import esiea.hackathon.leaders.domain.repository.RefCharacterRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ActionServiceTest {

    @InjectMocks
    private ActionService actionService;

    @Mock
    private PieceRepository pieceRepository;
    @Mock
    private RefCharacterRepository refCharacterRepository;
    @Mock
    private ActionFactory actionFactory;
    @Mock
    private ActionAbilityStrategy strategy;

    private PieceEntity piece;
    private final UUID gameId = UUID.randomUUID();
    private final UUID pieceId = UUID.randomUUID();
    private RefCharacterEntity character;

    @BeforeEach
    void setUp() {
        // Initialisation d'une pièce standard au centre (0,0) pour les tests
        piece = PieceEntity.builder()
                .id(pieceId)
                .gameId(gameId)
                .q((short) 0)
                .r((short) 0)
                .characterId("BRAWLER")
                .hasActedThisTurn(false)
                .build()
        ;

        character = mock(RefCharacterEntity.class);
    }

    @Test
    @DisplayName("La compétence est exécuté avec succès")
    void useAbility_Success() {
        String abilityId = "BRAWLER_PUSH";
        // La Pièce existe sur le plateau
        when(pieceRepository.findById(pieceId)).thenReturn(Optional.of(piece));
        // Récupère toutes les pièces
        when(pieceRepository.findByGameId(gameId)).thenReturn(List.of(piece));
        // Le personnage existe
        when(refCharacterRepository.findById("BRAWLER")).thenReturn(Optional.of(character));

        // Création d'une Compétence
        AbilityEntity ability = mock(AbilityEntity.class);
        // Cette compétence à pour id celle défini
        when(ability.getId()).thenReturn(abilityId);
        // BRAWLER possède une compétence
        when(character.getAbilities()).thenReturn(Set.of(ability));
        // Retour de la stratégie
        when(actionFactory.getStrategy(abilityId)).thenReturn(strategy);

        // Utilisation de la compétence par la pièce
        actionService.useAbility(pieceId, null, abilityId, null);

        // Vérification de la compétence
        verify(strategy).execute(eq(piece), isNull(), isNull(), anyList());
        verify(pieceRepository).save(piece);
        assertTrue(piece.getHasActedThisTurn());
    }

    @Test
    @DisplayName("Geôlier ennemi est adjacent, aucune compétence n’est utilisable")
    void useAbility_ImpossibleJailer() {
        PieceEntity jailer = PieceEntity.builder()
                .id(UUID.randomUUID())
                .gameId(gameId)
                .q((short) 1)
                .r((short) 0)
                .ownerIndex((short) 1)
                .characterId("JAILER")
                .hasActedThisTurn(false)
                .build()
        ;
        // La piece veut utiliser la capacité
        when(pieceRepository.findById(pieceId)).thenReturn(Optional.of(piece));

        // Une erreur de type IllegalStateException doit se declencher
        assertThrows(IllegalStateException.class, () ->
                actionService.useAbility(pieceId, null, "BRAWLER_PUSH", null)
        );
    }


    @Test
    @DisplayName("Protector ennemi est adjacent, ne peuvent déplacer ni le protecteur, ni ses alliés adjacents")
    void useAbility_ImpossibleProtector() {
        // Target
        PieceEntity target = PieceEntity.builder()
                .id(UUID.randomUUID())
                .gameId(gameId)
                .q((short) 1)
                .r((short) 0)
                .ownerIndex((short) 1)
                .hasActedThisTurn(false)
                .build()
        ;
        // Protector avec placement adjacent
        PieceEntity protector = PieceEntity.builder()
                .id(UUID.randomUUID())
                .gameId(gameId)
                .q((short) 1)
                .r((short) -1)
                .ownerIndex((short) 1)
                .characterId("PROTECTOR")
                .build()
        ;

        // La piece veut utiliser la capacité
        when(pieceRepository.findById(pieceId)).thenReturn(Optional.of(piece));

        // Une erreur de type IllegalStateException doit se declencher
        assertThrows(IllegalStateException.class, () ->
                actionService.useAbility(pieceId, target.getId(), "BRAWLER_PUSH", null)
        );



    }


}