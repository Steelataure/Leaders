package esiea.hackathon.leaders.application.services;

import esiea.hackathon.leaders.application.strategies.ActionAbilityStrategy;
import esiea.hackathon.leaders.application.strategies.action.ActionFactory;
import esiea.hackathon.leaders.application.strategies.passive.JailerBlockStrategy;
import esiea.hackathon.leaders.application.strategies.passive.PassiveFactory;
import esiea.hackathon.leaders.application.strategies.passive.ProtectorShieldStrategy;
import esiea.hackathon.leaders.domain.model.AbilityEntity;
import esiea.hackathon.leaders.domain.model.GameEntity;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import esiea.hackathon.leaders.domain.model.RefCharacterEntity;
import esiea.hackathon.leaders.domain.repository.GameRepository;
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

        // --- NOUVEAUX MOCKS NÉCESSAIRES ---
        @Mock
        private GameRepository gameRepository;
        @Mock
        private PassiveFactory passiveFactory;

        @Mock
        private ActionAbilityStrategy strategy;

        private PieceEntity piece;
        private GameEntity game;
        private final UUID gameId = UUID.randomUUID();
        private final UUID pieceId = UUID.randomUUID();
        private RefCharacterEntity character;

        @BeforeEach
        void setUp() {
                // Initialisation d'une pièce standard
                piece = PieceEntity.builder()
                                .id(pieceId)
                                .gameId(gameId)
                                .q((short) 0)
                                .r((short) 0)
                                .ownerIndex((short) 0) // J'appartiens au joueur 0
                                .characterId("BRAWLER")
                                .hasActedThisTurn(false)
                                .build();

                // Initialisation du Jeu (pour la validation du tour)
                game = GameEntity.builder()
                                .id(gameId)
                                .currentPlayerIndex(0) // C'est le tour du joueur 0
                                .build();

                character = mock(RefCharacterEntity.class);
        }

        @Test
        @DisplayName("La compétence est exécuté avec succès")
        void useAbility_Success() {
                String abilityId = "BRAWLER_PUSH";

                // 1. Mocks Repositories
                when(pieceRepository.findById(pieceId)).thenReturn(Optional.of(piece));
                when(gameRepository.findById(gameId)).thenReturn(Optional.of(game)); // FIX NPE
                when(refCharacterRepository.findById("BRAWLER")).thenReturn(Optional.of(character));
                when(pieceRepository.findByGameId(gameId)).thenReturn(List.of(piece));

                // 2. Mocks Character & Ability
                AbilityEntity ability = mock(AbilityEntity.class);
                when(ability.getId()).thenReturn(abilityId);
                when(character.getAbilities()).thenReturn(Set.of(ability));

                // 3. Mock Strategy Factory
                when(actionFactory.getStrategy(abilityId)).thenReturn(strategy);

                // 4. Execution
                actionService.useAbility(pieceId, null, abilityId, null, null);

                // 5. Verification
                verify(strategy).execute(eq(piece), isNull(), isNull(), anyList());
                verify(pieceRepository).save(piece);
                assertTrue(piece.getHasActedThisTurn());
        }

        @Test
        @DisplayName("Geôlier ennemi est adjacent, aucune compétence n’est utilisable")
        void useAbility_ImpossibleJailer() {
                // Mock du Jailer Ennemi
                PieceEntity jailer = PieceEntity.builder()
                                .id(UUID.randomUUID())
                                .gameId(gameId)
                                .q((short) 1)
                                .r((short) 0)
                                .ownerIndex((short) 1)
                                .characterId("JAILER")
                                .hasActedThisTurn(false)
                                .build();

                // Mocks de base
                when(pieceRepository.findById(pieceId)).thenReturn(Optional.of(piece));
                when(gameRepository.findById(gameId)).thenReturn(Optional.of(game)); // FIX NPE
                when(refCharacterRepository.findById("BRAWLER")).thenReturn(Optional.of(character));

                // Mock Ability check (pour passer la validation avant d'arriver au Jailer)
                String abilityId = "BRAWLER_PUSH";
                AbilityEntity ability = mock(AbilityEntity.class);
                when(ability.getId()).thenReturn(abilityId);
                when(character.getAbilities()).thenReturn(Set.of(ability));

                // Mock FindAll (Moi + Jailer)
                when(pieceRepository.findByGameId(gameId)).thenReturn(List.of(piece, jailer));

                // MOCK PASSIVE FACTORY pour le Jailer
                JailerBlockStrategy jailerStrategy = mock(JailerBlockStrategy.class);
                when(passiveFactory.getStrategy(eq("JAILER_BLOCK"), any())).thenReturn(jailerStrategy);
                // On dit que le geolier bloque effectivement
                when(jailerStrategy.isBlocking(any(), any())).thenReturn(true);

                // Assertion
                assertThrows(IllegalStateException.class,
                                () -> actionService.useAbility(pieceId, null, abilityId, null, null));
        }

        @Test
        @DisplayName("Protector ennemi est adjacent, impossible de cibler le protégé")
        void useAbility_ImpossibleProtector() {
                // Target (Ennemi)
                PieceEntity target = PieceEntity.builder()
                                .id(UUID.randomUUID())
                                .gameId(gameId)
                                .q((short) 1)
                                .r((short) 0)
                                .ownerIndex((short) 1)
                                .hasActedThisTurn(false)
                                .build();

                // Protector (Ami de la cible)
                PieceEntity protector = PieceEntity.builder()
                                .id(UUID.randomUUID())
                                .gameId(gameId)
                                .q((short) 1)
                                .r((short) -1)
                                .ownerIndex((short) 1)
                                .characterId("PROTECTOR")
                                .build();

                // Mocks de base
                when(pieceRepository.findById(pieceId)).thenReturn(Optional.of(piece));
                when(pieceRepository.findById(target.getId())).thenReturn(Optional.of(target));
                when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));
                when(refCharacterRepository.findById("BRAWLER")).thenReturn(Optional.of(character));

                // Mock Ability check
                String abilityId = "BRAWLER_PUSH";
                AbilityEntity ability = mock(AbilityEntity.class);
                when(ability.getId()).thenReturn(abilityId);
                when(character.getAbilities()).thenReturn(Set.of(ability));

                when(pieceRepository.findByGameId(gameId)).thenReturn(List.of(piece, target, protector));
                when(passiveFactory.getStrategy(eq("JAILER_BLOCK"), any())).thenReturn(null);

                ProtectorShieldStrategy protectorStrategy = mock(ProtectorShieldStrategy.class);
                when(passiveFactory.getStrategy(eq("PROTECTOR_SHIELD"), any())).thenReturn(protectorStrategy);
                when(protectorStrategy.isProtecting(any(), any())).thenReturn(true);

                // Assertion
                assertThrows(IllegalStateException.class,
                                () -> actionService.useAbility(pieceId, target.getId(), abilityId, null, null));
        }
}