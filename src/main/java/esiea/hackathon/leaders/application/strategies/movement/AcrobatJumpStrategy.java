package esiea.hackathon.leaders.application.strategies.movement;

import esiea.hackathon.leaders.application.strategies.MoveAbilityStrategy;
import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import org.springframework.stereotype.Component;
import java.util.ArrayList;
import java.util.List;

@Component
public class AcrobatJumpStrategy implements MoveAbilityStrategy {

    @Override
    public String getAbilityId() {
        return "ACROBAT_JUMP";
    }

    @Override
    public List<HexCoord> getExtraMoves(PieceEntity piece, List<PieceEntity> allPieces) {
        List<HexCoord> moves = new ArrayList<>();
        int[][] directions = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}, {1, -1}, {-1, 1}};

        for (int[] dir : directions) {
            short neighborQ = (short) (piece.getQ() + dir[0]);
            short neighborR = (short) (piece.getR() + dir[1]);

            // Atterrissage (Saut de mouton)
            short jumpQ = (short) (piece.getQ() + (dir[0] * 2));
            short jumpR = (short) (piece.getR() + (dir[1] * 2));

            HexCoord landing = new HexCoord(jumpQ, jumpR);

            // Conditions : Obstacle à sauter + Atterrissage vide + Atterrissage valide
            boolean hasObstacle = !isFree(neighborQ, neighborR, allPieces);
            boolean landingIsFree = isFree(jumpQ, jumpR, allPieces);

            if (landing.isValid() && hasObstacle && landingIsFree) {
                moves.add(landing);
            }
        }
        return moves;
    }

    private boolean isFree(short q, short r, List<PieceEntity> pieces) {
        return pieces.stream().noneMatch(p -> p.getQ() == q && p.getR() == r);
    }
}