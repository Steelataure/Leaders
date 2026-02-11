package esiea.hackathon.leaders.application.strategies.action;

import esiea.hackathon.leaders.application.strategies.ActionAbilityStrategy;
import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class InnKeeperAction implements ActionAbilityStrategy {

    @Override
    public String getAbilityId() {
        return "INNKEEPER_ASSIST";
    }

    @Override
    public void execute(PieceEntity source, PieceEntity target, HexCoord destination, HexCoord secondaryDestination,
            List<PieceEntity> allPieces) {
        if (target == null || destination == null) {
            throw new IllegalArgumentException("Target and Destination required");
        }

        // 1. Vérification : La cible doit être un ALLIÉ
        if (!target.getOwnerIndex().equals(source.getOwnerIndex())) {
            throw new IllegalArgumentException("Innkeeper can only assist allies");
        }

        // 2. Vérification : La cible doit être adjacente au Tavernier
        if (getDistance(source.getQ(), source.getR(), target.getQ(), target.getR()) != 1) {
            throw new IllegalArgumentException("Target ally must be adjacent to Innkeeper");
        }

        // 3. Vérification : La destination doit être adjacente à la CIBLE (mouvement de
        // 1 case)
        if (getDistance(target.getQ(), target.getR(), destination.q(), destination.r()) != 1) {
            throw new IllegalArgumentException("Destination must be adjacent to the target ally");
        }

        // 4. Case vide
        if (isOccupied(destination.q(), destination.r(), allPieces)) {
            throw new IllegalArgumentException("Destination is occupied");
        }

        // 5. Action
        target.setQ(destination.q());
        target.setR(destination.r());
    }

    private int getDistance(short q1, short r1, short q2, short r2) {
        int dq = Math.abs(q1 - q2);
        int dr = Math.abs(r1 - r2);
        int ds = Math.abs((q1 + r1) - (q2 + r2));
        return (dq + dr + ds) / 2;
    }

    private boolean isOccupied(short q, short r, List<PieceEntity> pieces) {
        return pieces.stream().anyMatch(p -> p.getQ() == q && p.getR() == r);
    }
}