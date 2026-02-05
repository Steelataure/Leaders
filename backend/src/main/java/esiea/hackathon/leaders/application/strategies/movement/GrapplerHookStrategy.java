package esiea.hackathon.leaders.application.strategies.movement;

import esiea.hackathon.leaders.application.strategies.MoveAbilityStrategy;
import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class GrapplerHookStrategy implements MoveAbilityStrategy {
    @Override
    public String getAbilityId() { return "GRAPPLE_HOOK"; }

    @Override
    public List<HexCoord> getExtraMoves(PieceEntity piece, List<PieceEntity> allPieces) {
        List<HexCoord> targets = new ArrayList<>();
        int[][] directions = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}, {1, -1}, {-1, 1}};

        for (int[] dir : directions) {
            for (int dist = 1; dist <= 6; dist++) {
                short tQ = (short) (piece.getQ() + (dir[0] * dist));
                short tR = (short) (piece.getR() + (dir[1] * dist));
                HexCoord current = new HexCoord(tQ, tR);
                if (!current.isValid()) break;

                PieceEntity occupant = allPieces.stream()
                        .filter(p -> p.getQ() == tQ && p.getR() == tR).findFirst().orElse(null);

                if (occupant != null) {
                    // On peut viser n'importe qui (Allié ou Ennemi)
                    targets.add(current);
                    break;
                }
            }
        }
        return targets;
    }
}