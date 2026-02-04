package esiea.hackathon.leaders.application.services;

import esiea.hackathon.leaders.application.strategies.ActionAbilityStrategy;
import esiea.hackathon.leaders.application.strategies.action.ActionFactory;
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
    private final ActionFactory actionFactory; // Ton usine à stratégies d'action

    /**
     * Exécute une compétence active (Bousculade, Grappin, Échange, etc.).
     * @param sourceId ID de la pièce qui lance l'action
     * @param targetId ID de la cible (peut être null selon le pouvoir)
     * @param abilityId ID de la compétence (ex: "BRAWLER_PUSH")
     * @param destination Case cible optionnelle (pour Manipulatrice/Tavernier)
     */
    @Transactional
    public void useAbility(UUID sourceId, UUID targetId, String abilityId, HexCoord destination) {
        // 1. Chargement de la source et du contexte
        PieceEntity source = pieceRepository.findById(sourceId)
                .orElseThrow(() -> new IllegalArgumentException("Source piece not found"));

        if (source.getHasActedThisTurn()) {
            throw new IllegalArgumentException("Piece has already acted this turn");
        }

        // Vérifie que le personnage possède bien cette compétence
        RefCharacterEntity character = characterRepository.findById(source.getCharacterId())
                .orElseThrow(() -> new IllegalStateException("Character definition not found"));

        boolean hasAbility = character.getAbilities().stream()
                .anyMatch(a -> a.getId().equals(abilityId));

        if (!hasAbility) {
            throw new IllegalArgumentException("This piece does not have the ability: " + abilityId);
        }

        // 2. Chargement de la cible et du plateau
        PieceEntity target = null;
        if (targetId != null) {
            target = pieceRepository.findById(targetId)
                    .orElseThrow(() -> new IllegalArgumentException("Target piece not found"));
        }

        // On charge tout le plateau pour vérifier les obstacles et les passifs
        List<PieceEntity> allPieces = pieceRepository.findByGameId(source.getGameId());

        // 3. --- VÉRIFICATION DES PASSIFS DÉFENSIFS (Règles Globales) ---

        // A. Règle du Geôlier (JAILER_BLOCK) :
        // "Les ennemis adjacents ne peuvent pas utiliser leur compétence active."
        if (isBlockedByJailer(source, allPieces)) {
            throw new IllegalStateException("Action blocked! An enemy Jailer is adjacent.");
        }

        // B. Règle du Protecteur (PROTECTOR_SHIELD) :
        // "Les compétences ennemies ne peuvent déplacer ni le protecteur, ni ses alliés adjacents."
        // Cette règle ne s'applique que si on cible un ennemi.
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

        // La stratégie effectue les modifications de coordonnées (setQ, setR)
        strategy.execute(source, target, destination, allPieces);

        // 5. Finalisation
        source.setHasActedThisTurn(true);
        pieceRepository.save(source);

        if (target != null) {
            pieceRepository.save(target);
        }
    }

    // --- Helpers pour les Passifs ---

    /**
     * Vérifie si la pièce source est adjacente à un Geôlier ennemi.
     */
    private boolean isBlockedByJailer(PieceEntity me, List<PieceEntity> allPieces) {
        return allPieces.stream()
                // C'est un Geôlier
                .filter(p -> "JAILER".equals(p.getCharacterId()))
                // C'est un ennemi
                .filter(p -> !p.getOwnerIndex().equals(me.getOwnerIndex()))
                // Il est adjacent
                .anyMatch(jailer -> areAdjacent(me, jailer));
    }

    /**
     * Vérifie si la cible est protégée (Soit elle est Protecteur, soit elle est à côté d'un Protecteur allié).
     */
    private boolean isTargetProtected(PieceEntity target, List<PieceEntity> allPieces) {
        // Cas 1 : La cible EST un Protecteur
        if ("PROTECTOR".equals(target.getCharacterId())) {
            return true;
        }

        // Cas 2 : La cible est adjacente à un Protecteur allié
        return allPieces.stream()
                .filter(p -> "PROTECTOR".equals(p.getCharacterId()))
                .filter(p -> p.getOwnerIndex().equals(target.getOwnerIndex())) // Allié de la cible
                .anyMatch(protector -> areAdjacent(target, protector));
    }

    // --- Helpers Mathématiques ---

    /**
     * Vérifie l'adjacence (Distance Hexagonale == 1)
     */
    private boolean areAdjacent(PieceEntity p1, PieceEntity p2) {
        int dq = Math.abs(p1.getQ() - p2.getQ());
        int dr = Math.abs(p1.getR() - p2.getR());
        int ds = Math.abs((p1.getQ() + p1.getR()) - (p2.getQ() + p2.getR()));

        // Distance = (diff_q + diff_r + diff_s) / 2
        return (dq + dr + ds) / 2 == 1;
    }
}