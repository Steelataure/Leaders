package esiea.hackathon.leaders.application.strategies.action;

import esiea.hackathon.leaders.application.strategies.ActionAbilityStrategy;
import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ManipulatorAction implements ActionAbilityStrategy {

    @Override
    public String getAbilityId() {
        return "MANIPULATOR_MOVE";
    }

    @Override
    public void execute(PieceEntity source, PieceEntity target, HexCoord destination, List<PieceEntity> allPieces) {
        if (target == null || destination == null) {
            throw new IllegalArgumentException("Target and Destination required");
        }

        // 1. Vérification : La cible doit être un ENNEMI
        if (target.getOwnerIndex().equals(source.getOwnerIndex())) {
            throw new IllegalArgumentException("Manipulator can only move enemies");
        }

        // 2. Vérification : La destination doit être adjacente à la CIBLE (distance 1)
        if (!areAdjacent(target.getQ(), target.getR(), destination.q(), destination.r())) {
            throw new IllegalArgumentException("Destination must be adjacent to the target");
        }

        // 3. Vérification : Case vide
        if (isOccupied(destination.q(), destination.r(), allPieces)) {
            throw new IllegalArgumentException("Destination is occupied");
        }

        // 4. Action
        target.setQ(destination.q());
        target.setR(destination.r());
    }

    private boolean areAdjacent(short q1, short r1, short q2, short r2) {
        int dq = Math.abs(q1 - q2);
        int dr = Math.abs(r1 - r2);
        int ds = Math.abs((q1 + r1) - (q2 + r2));
        return (dq + dr + ds) / 2 == 1;
    }

    private boolean isOccupied(short q, short r, List<PieceEntity> pieces) {
        return pieces.stream().anyMatch(p -> p.getQ() == q && p.getR() == r);
    }
}