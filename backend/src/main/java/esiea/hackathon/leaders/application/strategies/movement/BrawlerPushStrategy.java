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
    public String getAbilityId() {
        return "BRAWLER_PUSH";
    }

    @Override
    public List<HexCoord> getExtraMoves(PieceEntity piece, List<PieceEntity> allPieces) {
        List<HexCoord> targetEnemies = new ArrayList<>();

        // Scan for enemies at distance 1 and 2
        for (PieceEntity other : allPieces) {
            if (!other.getOwnerIndex().equals(piece.getOwnerIndex())) {
                int dist = distance(piece.getQ(), piece.getR(), other.getQ(), other.getR());
                if (dist == 1 || dist == 2) {
                    targetEnemies.add(new HexCoord(other.getQ(), other.getR()));
                }
            }
        }
        return targetEnemies;
    }

    private int distance(int q1, int r1, int q2, int r2) {
        return (Math.abs(q1 - q2) + Math.abs(q1 + r1 - q2 - r2) + Math.abs(r1 - r2)) / 2;
    }
}