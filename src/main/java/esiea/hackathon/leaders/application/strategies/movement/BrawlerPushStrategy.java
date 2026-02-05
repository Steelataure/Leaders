package esiea.hackathon.leaders.application.strategies.movement;

import esiea.hackathon.leaders.application.strategies.MoveAbilityStrategy;
import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class BrawlerPushStrategy implements MoveAbilityStrategy {
    @Override
    public String getAbilityId() { return "BRAWLER_PUSH"; }

    @Override
    public List<HexCoord> getExtraMoves(PieceEntity piece, List<PieceEntity> allPieces) {
        List<HexCoord> moves = new ArrayList<>();
        int[][] directions = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}, {1, -1}, {-1, 1}};

        for (int[] dir : directions) {
            short nQ = (short) (piece.getQ() + dir[0]);
            short nR = (short) (piece.getR() + dir[1]);
            HexCoord target = new HexCoord(nQ, nR);

            // On cherche un ENNEMI adjacent
            if (target.isValid() && isEnemy(nQ, nR, piece.getOwnerIndex(), allPieces)) {
                moves.add(target);
            }
        }
        return moves;
    }

    private boolean isEnemy(short q, short r, Short myOwner, List<PieceEntity> pieces) {
        return pieces.stream().anyMatch(p -> p.getQ() == q && p.getR() == r && !p.getOwnerIndex().equals(myOwner));
    }
}