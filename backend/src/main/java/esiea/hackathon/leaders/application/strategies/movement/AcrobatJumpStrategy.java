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
        int[][] directions = { { 1, 0 }, { -1, 0 }, { 0, 1 }, { 0, -1 }, { 1, -1 }, { -1, 1 } };

        // 1er saut
        for (int[] dir : directions) {
            HexCoord jump1 = getJumpLanding(piece.getQ(), piece.getR(), dir, allPieces);

            if (jump1 != null) {
                // Ajout du 1er saut
                moves.add(jump1);

                // 2ème saut (depuis jump1)
                for (int[] dir2 : directions) {
                    // On ne repart pas en arrière immédiatement si c'est pour revenir sur la case
                    // de départ (optionnel, mais souvent logique)
                    // Ici on autorise tout car le joueur peut vouloir revenir.

                    HexCoord jump2 = getJumpLanding(jump1.q(), jump1.r(), dir2, allPieces);
                    if (jump2 != null && !jump2.equals(new HexCoord(piece.getQ(), piece.getR()))) {
                        moves.add(jump2);
                    }
                }
            }
        }
        return moves;
    }

    private HexCoord getJumpLanding(short startQ, short startR, int[] dir, List<PieceEntity> allPieces) {
        short neighborQ = (short) (startQ + dir[0]);
        short neighborR = (short) (startR + dir[1]);

        // Atterrissage
        short jumpQ = (short) (startQ + (dir[0] * 2));
        short jumpR = (short) (startR + (dir[1] * 2));

        HexCoord landing = new HexCoord(jumpQ, jumpR);

        // Conditions : Obstacle à sauter + Atterrissage valide + Atterrissage vide
        boolean hasObstacle = !isFree(neighborQ, neighborR, allPieces);
        boolean landingIsFree = isFree(jumpQ, jumpR, allPieces);

        if (landing.isValid() && hasObstacle && landingIsFree) {
            return landing;
        }
        return null;
    }

    private boolean isFree(short q, short r, List<PieceEntity> pieces) {
        return pieces.stream().noneMatch(p -> p.getQ() == q && p.getR() == r);
    }
}