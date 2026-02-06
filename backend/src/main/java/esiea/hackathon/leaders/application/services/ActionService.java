package esiea.hackathon.leaders.application.services;

import esiea.hackathon.leaders.application.strategies.ActionAbilityStrategy;
import esiea.hackathon.leaders.application.strategies.action.ActionFactory;
import esiea.hackathon.leaders.application.strategies.passive.JailerBlockStrategy;
import esiea.hackathon.leaders.application.strategies.passive.PassiveFactory;
import esiea.hackathon.leaders.application.strategies.passive.ProtectorShieldStrategy;
import esiea.hackathon.leaders.domain.model.GameEntity;
import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import esiea.hackathon.leaders.domain.model.RefCharacterEntity;
import esiea.hackathon.leaders.domain.repository.GameRepository;
import esiea.hackathon.leaders.domain.repository.PieceRepository;
import esiea.hackathon.leaders.domain.repository.RefCharacterRepository;
import lombok.RequiredArgsConstructor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ActionService {

    private static final Logger LOGGER = LogManager.getLogger(ActionService.class);

    private final PieceRepository pieceRepository;
    private final RefCharacterRepository characterRepository;
    private final ActionFactory actionFactory;
    private final PassiveFactory passiveFactory;
    private final GameRepository gameRepository;

    @Transactional
    public void useAbility(UUID sourceId, UUID targetId, String abilityId, HexCoord destination) {
        LOGGER.info("Tentative d'utilisation de la compétence '{}' par la pièce {}", abilityId, sourceId);

        // 1. Chargement de la source
        PieceEntity source = pieceRepository.findById(sourceId)
                .orElseThrow(() -> {
                    LOGGER.error("Échec : Pièce source introuvable pour l'ID {}", sourceId);
                    return new IllegalArgumentException("Source piece not found");
                });

        // 2. Chargement du Jeu
        GameEntity game = gameRepository.findById(source.getGameId())
                .orElseThrow(() -> {
                    LOGGER.error("Échec : Partie introuvable pour l'ID {}", source.getGameId());
                    return new IllegalArgumentException("Game not found");
                });

        // 3. 🛑 SÉCURITÉ : Vérification du tour
        if (source.getOwnerIndex().intValue() != game.getCurrentPlayerIndex()) {
            LOGGER.warn("Action refusée : Le joueur {} tente de jouer pendant le tour du joueur {}", 
                        source.getOwnerIndex(), game.getCurrentPlayerIndex());
            throw new IllegalStateException("Action refusée : Ce n'est pas votre tour !");
        }

        if (source.getHasActedThisTurn()) {
            LOGGER.warn("Action refusée : La pièce {} a déjà agi ce tour-ci", sourceId);
            throw new IllegalArgumentException("Piece has already acted this turn");
        }

        // Vérification que le perso possède bien la compétence
        RefCharacterEntity character = characterRepository.findById(source.getCharacterId())
                .orElseThrow(() -> {
                    LOGGER.error("Erreur critique : Définition du personnage introuvable pour {}", source.getCharacterId());
                    return new IllegalStateException("Character definition not found");
                });

        boolean hasAbility = character.getAbilities().stream()
                .anyMatch(a -> a.getId().equals(abilityId));

        if (!hasAbility) {
            LOGGER.error("Action refusée : Le personnage {} ne possède pas la compétence '{}'", source.getCharacterId(), abilityId);
            throw new IllegalArgumentException("This piece does not have the ability: " + abilityId);
        }

        // Chargement de la cible (optionnel selon l'action)
        PieceEntity target = null;
        if (targetId != null) {
            target = pieceRepository.findById(targetId)
                    .orElseThrow(() -> {
                        LOGGER.error("Échec : Pièce cible introuvable pour l'ID {}", targetId);
                        return new IllegalArgumentException("Target piece not found");
                    });
        }

        List<PieceEntity> allPieces = pieceRepository.findByGameId(source.getGameId());

        // --- Vérification des PASSIFS défensifs (Geôlier, Protecteur) ---
        if (isBlockedByJailer(source, allPieces)) {
            LOGGER.info("Action bloquée : Un Geôlier ennemi est à proximité de la pièce {}", sourceId);
            throw new IllegalStateException("Action blocked! An enemy Jailer is adjacent.");
        }

        if (target != null && !target.getOwnerIndex().equals(source.getOwnerIndex())) {
            if (isTargetProtected(target, allPieces)) {
                LOGGER.info("Action bloquée : La cible {} est protégée par un bouclier", targetId);
                throw new IllegalStateException("Action blocked! The target is protected by a Shield.");
            }
        }

        // Exécution de la Stratégie via Factory
        ActionAbilityStrategy strategy = actionFactory.getStrategy(abilityId);
        if (strategy == null) {
            LOGGER.error("Erreur technique : Aucune implémentation trouvée pour la compétence '{}'", abilityId);
            throw new IllegalArgumentException("No implementation found for ability: " + abilityId);
        }

        LOGGER.debug("Exécution de la stratégie pour la compétence '{}'", abilityId);
        strategy.execute(source, target, destination, allPieces);

        // Validation de l'action
        source.setHasActedThisTurn(true);
        pieceRepository.save(source);

        if (target != null) {
            pieceRepository.save(target);
        }

        LOGGER.info("Succès : Compétence '{}' exécutée avec succès pour la pièce {}", abilityId, sourceId);
    }

    // --- Helpers Passifs ---

    private boolean isBlockedByJailer(PieceEntity me, List<PieceEntity> allPieces) {
        JailerBlockStrategy strategy = passiveFactory.getStrategy("JAILER_BLOCK", JailerBlockStrategy.class);
        if (strategy == null) {
            LOGGER.warn("Stratégie JAILER_BLOCK introuvable dans la factory");
            return false;
        }

        return allPieces.stream()
                .filter(p -> "JAILER".equals(p.getCharacterId()))
                .filter(p -> !p.getOwnerIndex().equals(me.getOwnerIndex())) // Ennemi
                .anyMatch(jailer -> strategy.isBlocking(jailer, me));
    }

    private boolean isTargetProtected(PieceEntity target, List<PieceEntity> allPieces) {
        ProtectorShieldStrategy strategy = passiveFactory.getStrategy("PROTECTOR_SHIELD", ProtectorShieldStrategy.class);
        if (strategy == null) {
            LOGGER.warn("Stratégie PROTECTOR_SHIELD introuvable dans la factory");
            return false;
        }

        return allPieces.stream()
                .filter(p -> "PROTECTOR".equals(p.getCharacterId()))
                .filter(p -> p.getOwnerIndex().equals(target.getOwnerIndex())) // Allié de la cible
                .anyMatch(protector -> strategy.isProtecting(protector, target));
    }
}