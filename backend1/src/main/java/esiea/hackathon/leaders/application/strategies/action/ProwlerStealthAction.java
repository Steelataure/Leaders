package esiea.hackathon.leaders.application.strategies.action;

import esiea.hackathon.leaders.application.strategies.ActionAbilityStrategy;
import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import org.springframework.stereotype.Component;

import java.util.List;

@Component("prowlerStealthAction")
public class ProwlerStealthAction implements ActionAbilityStrategy {

    @Override
    public String getAbilityId() {
        return "PROWLER_STEALTH";
    }

    @Override
    public void execute(PieceEntity source, PieceEntity target, HexCoord dest, List<PieceEntity> allPieces) {
        if (dest == null) {
            throw new IllegalArgumentException("Destination is required for Teleport");
        }

        // 1. La case doit être sur le plateau
        if (!dest.isValid()) {
            throw new IllegalArgumentException("Cannot teleport off the board");
        }

        // 2. La case doit être VIDE
        if (isOccupied(dest.q(), dest.r(), allPieces)) {
            throw new IllegalArgumentException("Destination is occupied");
        }

        // 3. RÈGLE D'OR : Pas d'ennemi adjacent à la case d'arrivée
        boolean isUnsafe = allPieces.stream()
                // On ne regarde que les ENNEMIS
                .filter(p -> !p.getOwnerIndex().equals(source.getOwnerIndex()))
                .anyMatch(enemy -> areAdjacent(dest.q(), dest.r(), enemy.getQ(), enemy.getR()));

        if (isUnsafe) {
            throw new IllegalArgumentException("Cannot teleport adjacent to an enemy!");
        }

        // 4. Téléportation
        source.setQ(dest.q());
        source.setR(dest.r());
    }

    // --- Helpers ---
    private boolean isOccupied(short q, short r, List<PieceEntity> pieces) {
        return pieces.stream().anyMatch(p -> p.getQ() == q && p.getR() == r);
    }

    private boolean areAdjacent(int q1, int r1, int q2, int r2) {
        int dist = (Math.abs(q1 - q2) + Math.abs(r1 - r2) + Math.abs((q1 + r1) - (q2 + r2))) / 2;
        return dist == 1;
    }
}