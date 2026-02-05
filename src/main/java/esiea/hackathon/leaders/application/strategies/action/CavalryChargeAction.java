package esiea.hackathon.leaders.application.strategies.action;

import esiea.hackathon.leaders.application.strategies.ActionAbilityStrategy;
import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import org.springframework.stereotype.Component;

import java.util.List;

@Component("cavalryChargeAction")
public class CavalryChargeAction implements ActionAbilityStrategy {

    @Override
    public String getAbilityId() {
        return "CAVALRY_CHARGE";
    }

    @Override
    public void execute(PieceEntity source, PieceEntity target, HexCoord dest, List<PieceEntity> allPieces) {
        if (dest == null) {
            throw new IllegalArgumentException("Destination is required for Charge");
        }

        // 1. Calcul du vecteur (Destination - Source)
        int dq = dest.q() - source.getQ();
        int dr = dest.r() - source.getR();
        int ds = -dq - dr;

        // 2. Vérification de la LIGNE DROITE (Une des coord doit être 0)
        if (dq != 0 && dr != 0 && ds != 0) {
            throw new IllegalArgumentException("Cavalry must charge in a straight line");
        }

        // 3. Vérification de la DISTANCE (Doit être exactement 2)
        int distance = (Math.abs(dq) + Math.abs(dr) + Math.abs(ds)) / 2;
        if (distance != 2) {
            throw new IllegalArgumentException("Cavalry must move exactly 2 spaces");
        }

        // 4. Vérification que la case d'arrivée est vide
        if (isOccupied(dest.q(), dest.r(), allPieces)) {
            throw new IllegalArgumentException("Destination is occupied");
        }

        // 5. Vérification du CHEMIN (Pas de saut, case intermédiaire vide)
        int midQ = source.getQ() + (dq / 2);
        int midR = source.getR() + (dr / 2);

        if (isOccupied((short) midQ, (short) midR, allPieces)) {
            throw new IllegalArgumentException("Path is blocked (cannot jump)");
        }

        // 6. EXECUTION : Mise à jour des coordonnées
        source.setQ(dest.q());
        source.setR(dest.r());
    }

    private boolean isOccupied(short q, short r, List<PieceEntity> pieces) {
        return pieces.stream().anyMatch(p -> p.getQ() == q && p.getR() == r);
    }
}