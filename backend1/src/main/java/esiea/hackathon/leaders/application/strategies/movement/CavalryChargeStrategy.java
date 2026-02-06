package esiea.hackathon.leaders.application.strategies.movement;

import esiea.hackathon.leaders.application.strategies.MoveAbilityStrategy;
import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import org.springframework.stereotype.Component;
import java.util.ArrayList;
import java.util.List;

@Component
public class CavalryChargeStrategy implements MoveAbilityStrategy {

    @Override
    public String getAbilityId() {
        return "CAVALRY_CHARGE";
    }

    @Override
    public List<HexCoord> getExtraMoves(PieceEntity piece, List<PieceEntity> allPieces) {
        List<HexCoord> moves = new ArrayList<>();
        // Directions : E, W, SE, NW, SW, NE
        int[][] directions = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}, {1, -1}, {-1, 1}};

        for (int[] dir : directions) {
            // Case à distance 2 (Charge)
            short targetQ = (short) (piece.getQ() + (dir[0] * 2));
            short targetR = (short) (piece.getR() + (dir[1] * 2));

            // Case intermédiaire (doit être vide pour charger à travers)
            short midQ = (short) (piece.getQ() + dir[0]);
            short midR = (short) (piece.getR() + dir[1]);

            HexCoord target = new HexCoord(targetQ, targetR);

            // Conditions : Cible valide + Cible vide + Passage vide
            if (target.isValid() && isFree(targetQ, targetR, allPieces) && isFree(midQ, midR, allPieces)) {
                moves.add(target);
            }
        }
        return moves;
    }

    private boolean isFree(short q, short r, List<PieceEntity> pieces) {
        return pieces.stream().noneMatch(p -> p.getQ() == q && p.getR() == r);
    }
}