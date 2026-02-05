package esiea.hackathon.leaders.application.services;

import esiea.hackathon.leaders.application.strategies.ActionAbilityStrategy;
import esiea.hackathon.leaders.application.strategies.action.ActionFactory;
import esiea.hackathon.leaders.application.strategies.passive.JailerBlockStrategy;
import esiea.hackathon.leaders.application.strategies.passive.PassiveFactory;
import esiea.hackathon.leaders.application.strategies.passive.ProtectorShieldStrategy;
import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import esiea.hackathon.leaders.domain.model.RefCharacterEntity;
import esiea.hackathon.leaders.domain.repository.PieceRepository;
import esiea.hackathon.leaders.domain.repository.RefCharacterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ActionService {

    private final PieceRepository pieceRepository;
    private final RefCharacterRepository characterRepository;
    private final ActionFactory actionFactory;   // Pour les actions actives
    private final PassiveFactory passiveFactory; // AJOUT : Pour les passifs défensifs

    @Transactional
    public void useAbility(UUID sourceId, UUID targetId, String abilityId, HexCoord destination) {
        // 1. Chargement de la source
        PieceEntity source = pieceRepository.findById(sourceId)
                .orElseThrow(() -> new IllegalArgumentException("Source piece not found"));

        if (source.getHasActedThisTurn()) {
            throw new IllegalArgumentException("Piece has already acted this turn");
        }

        // Vérification de la compétence
        RefCharacterEntity character = characterRepository.findById(source.getCharacterId())
                .orElseThrow(() -> new IllegalStateException("Character definition not found"));

        boolean hasAbility = character.getAbilities().stream()
                .anyMatch(a -> a.getId().equals(abilityId));

        if (!hasAbility) {
            throw new IllegalArgumentException("This piece does not have the ability: " + abilityId);
        }

        // 2. Chargement de la cible
        PieceEntity target = null;
        if (targetId != null) {
            target = pieceRepository.findById(targetId)
                    .orElseThrow(() -> new IllegalArgumentException("Target piece not found"));
        }

        List<PieceEntity> allPieces = pieceRepository.findByGameId(source.getGameId());

        // 3. --- VÉRIFICATION DES PASSIFS VIA FACTORY ---

        // A. Geôlier
        if (isBlockedByJailer(source, allPieces)) {
            throw new IllegalStateException("Action blocked! An enemy Jailer is adjacent.");
        }

        // B. Protecteur (Seulement si on cible un ennemi)
        if (target != null && !target.getOwnerIndex().equals(source.getOwnerIndex())) {
            if (isTargetProtected(target, allPieces)) {
                throw new IllegalStateException("Action blocked! The target is protected by a Shield.");
            }
        }

        // 4. Exécution de la Stratégie
        ActionAbilityStrategy strategy = actionFactory.getStrategy(abilityId);
        if (strategy == null) {
            throw new IllegalArgumentException("No implementation found for ability: " + abilityId);
        }

        strategy.execute(source, target, destination, allPieces);

        // 5. Finalisation
        source.setHasActedThisTurn(true);
        pieceRepository.save(source);

        if (target != null) {
            pieceRepository.save(target);
        }
    }

    // --- Helpers utilisant la PassiveFactory ---

    private boolean isBlockedByJailer(PieceEntity me, List<PieceEntity> allPieces) {
        // Récupération dynamique de la stratégie
        JailerBlockStrategy strategy = passiveFactory.getStrategy("JAILER_BLOCK", JailerBlockStrategy.class);
        if (strategy == null) return false; // Sécurité si la stratégie n'existe pas encore

        return allPieces.stream()
                .filter(p -> "JAILER".equals(p.getCharacterId()))
                .filter(p -> !p.getOwnerIndex().equals(me.getOwnerIndex())) // Ennemi
                .anyMatch(jailer -> strategy.isBlocking(jailer, me)); // Délégation logique
    }

    private boolean isTargetProtected(PieceEntity target, List<PieceEntity> allPieces) {
        // Récupération dynamique de la stratégie
        ProtectorShieldStrategy strategy = passiveFactory.getStrategy("PROTECTOR_SHIELD", ProtectorShieldStrategy.class);
        if (strategy == null) return false;

        return allPieces.stream()
                .filter(p -> "PROTECTOR".equals(p.getCharacterId()))
                .filter(p -> p.getOwnerIndex().equals(target.getOwnerIndex())) // Allié de la cible
                .anyMatch(protector -> strategy.isProtecting(protector, target)); // Délégation logique
    }
}