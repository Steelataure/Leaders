package esiea.hackathon.leaders.application.strategies.action;

import esiea.hackathon.leaders.application.strategies.ActionAbilityStrategy;
import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import org.springframework.stereotype.Component;
import esiea.hackathon.leaders.domain.utils.HexUtils;
import java.util.List;

@Component("manipulatorAction")
public class ManipulatorAction implements ActionAbilityStrategy {

    @Override
    public String getAbilityId() {
        return "MANIPULATOR_MOVE";
    }

    @Override
    public void execute(PieceEntity source, PieceEntity target, HexCoord destination, HexCoord secondaryDestination,
            List<PieceEntity> allPieces) {
        if (target == null || destination == null)
            throw new IllegalArgumentException("Target and Destination required");

        if (target.getOwnerIndex().equals(source.getOwnerIndex())) {
            throw new IllegalArgumentException("Manipulator can only move enemies");
        }

        // PROTECTION CHECK
        if (HexUtils.isProtected(target, allPieces)) {
            throw new IllegalArgumentException("Target is protected by a Protector's aura!");
        }

        HexCoord sourceCoord = new HexCoord(source.getQ(), source.getR());
        HexCoord targetCoord = new HexCoord(target.getQ(), target.getR());

        // RÈGLE 1 : Source <-> Cible doit être Non-Adjacent et Visible
        if (HexUtils.getDistance(sourceCoord, targetCoord) <= 1) {
            throw new IllegalArgumentException("Target must be non-adjacent to Manipulator");
        }

        // VISIBILITÉ STRICTE (Ligne droite + Pas d'obstacle)
        if (!HexUtils.isPathClear(sourceCoord, targetCoord, allPieces)) {
            throw new IllegalArgumentException("Target must be visible to Manipulator (Straight line & No obstacles)");
        }

        // RÈGLE 2 : Cible <-> Destination doit être Adjacent (1 case)
        if (HexUtils.getDistance(target.getQ(), target.getR(), destination.q(), destination.r()) != 1) {
            throw new IllegalArgumentException("Destination must be adjacent to the target");
        }

        if (HexUtils.isOccupied(destination, allPieces)) {
            throw new IllegalArgumentException("Destination is occupied");
        }

        target.setQ(destination.q());
        target.setR(destination.r());
    }
}