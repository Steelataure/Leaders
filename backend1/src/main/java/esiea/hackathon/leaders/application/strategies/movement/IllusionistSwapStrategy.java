package esiea.hackathon.leaders.application.strategies.movement;

import esiea.hackathon.leaders.application.strategies.MoveAbilityStrategy;
import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class IllusionistSwapStrategy implements MoveAbilityStrategy {
    @Override
    public String getAbilityId() { return "ILLUSIONIST_SWAP"; }

    @Override
    public List<HexCoord> getExtraMoves(PieceEntity piece, List<PieceEntity> allPieces) {
        return getLineOfSightTargets(piece, allPieces, false); // false = pas seulement ennemi
    }

    // Méthode générique pour "Visible en ligne droite"
    private List<HexCoord> getLineOfSightTargets(PieceEntity start, List<PieceEntity> allPieces, boolean enemiesOnly) {
        List<HexCoord> targets = new ArrayList<>();
        int[][] directions = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}, {1, -1}, {-1, 1}};

        for (int[] dir : directions) {
            for (int dist = 1; dist <= 6; dist++) { // On avance dans la direction
                short tQ = (short) (start.getQ() + (dir[0] * dist));
                short tR = (short) (start.getR() + (dir[1] * dist));
                HexCoord current = new HexCoord(tQ, tR);

                if (!current.isValid()) break; // Sortie du plateau

                // Qui est là ?
                PieceEntity occupant = allPieces.stream()
                        .filter(p -> p.getQ() == tQ && p.getR() == tR).findFirst().orElse(null);

                if (occupant != null) {
                    // Si on a trouvé quelqu'un
                    if (dist > 1) { // "Non-adjacent" selon la règle
                        if (!enemiesOnly || !occupant.getOwnerIndex().equals(start.getOwnerIndex())) {
                            targets.add(current);
                        }
                    }
                    break;
                }
                // Si case vide, on continue de regarder plus loin
            }
        }
        return targets;
    }
}