package esiea.hackathon.leaders.application.strategies.movement;

import esiea.hackathon.leaders.application.strategies.MoveAbilityStrategy;
import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class ProwlerStealthStrategy implements MoveAbilityStrategy {
    @Override
    public String getAbilityId() { return "PROWLER_STEALTH"; }

    @Override
    public List<HexCoord> getExtraMoves(PieceEntity piece, List<PieceEntity> allPieces) {
        List<HexCoord> moves = new ArrayList<>();
        int radius = HexCoord.BOARD_RADIUS; // 3

        // 1. Scanner tout le plateau
        for (short q = (short) -radius; q <= radius; q++) {
            for (short r = (short) -radius; r <= radius; r++) {
                if (Math.abs(q + r) > radius) continue; // Hors hexagone

                HexCoord target = new HexCoord(q, r);

                // La case cible doit être vide
                if (isFree(q, r, allPieces)) {
                    // Et ne doit avoir AUCUN ennemi voisin
                    if (!hasEnemyNeighbor(target, piece.getOwnerIndex(), allPieces)) {
                        moves.add(target);
                    }
                }
            }
        }
        return moves;
    }

    private boolean isFree(short q, short r, List<PieceEntity> pieces) {
        return pieces.stream().noneMatch(p -> p.getQ() == q && p.getR() == r);
    }

    private boolean hasEnemyNeighbor(HexCoord coord, Short myOwnerIndex, List<PieceEntity> allPieces) {
        int[][] directions = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}, {1, -1}, {-1, 1}};
        for (int[] dir : directions) {
            short nQ = (short) (coord.q() + dir[0]);
            short nR = (short) (coord.r() + dir[1]);

            // Si on trouve une pièce ennemie adjacente
            boolean enemyFound = allPieces.stream()
                    .anyMatch(p -> p.getQ() == nQ && p.getR() == nR && !p.getOwnerIndex().equals(myOwnerIndex));

            if (enemyFound) return true;
        }
        return false;
    }
}