package esiea.hackathon.leaders.application.strategies.action;

import esiea.hackathon.leaders.application.strategies.ActionAbilityStrategy;
import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import org.springframework.stereotype.Component;
import java.util.List;

@Component("manipulatorAction")
public class ManipulatorAction implements ActionAbilityStrategy {

    @Override
    public String getAbilityId() { return "MANIPULATOR_MOVE"; }

    @Override
    public void execute(PieceEntity source, PieceEntity target, HexCoord destination, List<PieceEntity> allPieces) {
        if (target == null || destination == null) throw new IllegalArgumentException("Target and Destination required");

        if (target.getOwnerIndex().equals(source.getOwnerIndex())) {
            throw new IllegalArgumentException("Manipulator can only move enemies");
        }

        // RÈGLE 1 : Source <-> Cible doit être Non-Adjacent et Visible
        if (getDistance(source, target) <= 1) {
            throw new IllegalArgumentException("Target must be non-adjacent to Manipulator");
        }
        if (!isInLineOfSight(source, target)) {
            throw new IllegalArgumentException("Target must be visible to Manipulator");
        }

        // RÈGLE 2 : Cible <-> Destination doit être Adjacent (1 case)
        if (getDistance(target, destination.q(), destination.r()) != 1) {
            throw new IllegalArgumentException("Destination must be adjacent to the target");
        }

        if (isOccupied(destination.q(), destination.r(), allPieces)) {
            throw new IllegalArgumentException("Destination is occupied");
        }

        target.setQ(destination.q());
        target.setR(destination.r());
    }

    // Helpers identiques (tu peux aussi les mettre dans une classe utilitaire HexUtil)
    private int getDistance(PieceEntity p1, PieceEntity p2) {
        return (Math.abs(p1.getQ() - p2.getQ()) + Math.abs(p1.getR() - p2.getR()) + Math.abs((p1.getQ() + p1.getR()) - (p2.getQ() + p2.getR()))) / 2;
    }
    private int getDistance(PieceEntity p1, int q2, int r2) {
        return (Math.abs(p1.getQ() - q2) + Math.abs(p1.getR() - r2) + Math.abs((p1.getQ() + p1.getR()) - (q2 + r2))) / 2;
    }
    private boolean isInLineOfSight(PieceEntity p1, PieceEntity p2) {
        return p1.getQ() == p2.getQ() || p1.getR() == p2.getR() || (p1.getQ() + p1.getR()) == (p2.getQ() + p2.getR());
    }
    private boolean isOccupied(short q, short r, List<PieceEntity> pieces) {
        return pieces.stream().anyMatch(p -> p.getQ() == q && p.getR() == r);
    }
}