package esiea.hackathon.leaders.application.strategies.action;

import esiea.hackathon.leaders.application.strategies.ActionAbilityStrategy;
import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Lance-Grappin : se déplace jusqu'à un Personnage visible en ligne droite OU
 * l'attire jusqu'à lui.
 * 
 * Mode 1 (PULL) : destination = null → Attire la cible vers le Grappler
 * Mode 2 (MOVE) : destination != null → Le Grappler se déplace vers la cible
 */
@Component("grappleHookAction")
public class GrappleHookAction implements ActionAbilityStrategy {

    @Override
    public String getAbilityId() {
        return "GRAPPLE_HOOK";
    }

    @Override
    public void execute(PieceEntity source, PieceEntity target, HexCoord dest, List<PieceEntity> allPieces) {
        if (target == null) {
            throw new IllegalArgumentException("Target required for Grapple");
        }

        // Calcul de la distance et direction
        int dq = target.getQ() - source.getQ();
        int dr = target.getR() - source.getR();
        int dist = (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;

        if (dist <= 1) {
            throw new IllegalArgumentException("Target is too close to grapple (must be non-adjacent)");
        }

        // Vérifier ligne droite
        int ds = -dq - dr;
        if (dq != 0 && dr != 0 && ds != 0) {
            throw new IllegalArgumentException("Target must be in a straight line");
        }

        // Vérifier visibilité (chemin libre)
        if (!isPathClear(source, target, allPieces)) {
            throw new IllegalArgumentException("Path to target is blocked");
        }

        // Direction unitaire (de source vers target)
        int dirQ = dq / dist;
        int dirR = dr / dist;

        if (dest != null) {
            // === MODE 2: MOVE - Le Grappler se déplace vers la cible ===
            // La destination doit être adjacente à la cible
            if (getDistance(target.getQ(), target.getR(), dest.q(), dest.r()) != 1) {
                throw new IllegalArgumentException("Grappler must land adjacent to target");
            }

            // La destination doit être sur la ligne entre source et target
            // (ou au moins dans la bonne direction)
            if (isOccupied(dest.q(), dest.r(), allPieces)) {
                throw new IllegalArgumentException("Cannot move: destination is occupied");
            }

            // Déplacer le Grappler
            source.setQ(dest.q());
            source.setR(dest.r());

        } else {
            // === MODE 1: PULL - Attire la cible vers le Grappler ===
            // La cible arrive sur la case adjacente au Grappler, en direction de la cible
            short pullDestQ = (short) (source.getQ() + dirQ);
            short pullDestR = (short) (source.getR() + dirR);

            if (isOccupied(pullDestQ, pullDestR, allPieces)) {
                throw new IllegalArgumentException("Cannot pull: cell adjacent to you is occupied");
            }

            // Déplacer la cible
            target.setQ(pullDestQ);
            target.setR(pullDestR);
        }

    }

    // --- Helpers ---

    private int getDistance(int q1, int r1, int q2, int r2) {
        return (Math.abs(q1 - q2) + Math.abs(r1 - r2) + Math.abs((q1 + r1) - (q2 + r2))) / 2;
    }

    private boolean isOccupied(short q, short r, List<PieceEntity> pieces) {
        return pieces.stream().anyMatch(p -> p.getQ() == q && p.getR() == r);
    }

    private boolean isPathClear(PieceEntity source, PieceEntity target, List<PieceEntity> allPieces) {
        int dq = target.getQ() - source.getQ();
        int dr = target.getR() - source.getR();
        int dist = (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;

        if (dist <= 1)
            return true;

        int dirQ = dq / dist;
        int dirR = dr / dist;

        for (int i = 1; i < dist; i++) {
            short checkQ = (short) (source.getQ() + dirQ * i);
            short checkR = (short) (source.getR() + dirR * i);
            if (isOccupied(checkQ, checkR, allPieces)) {
                return false;
            }
        }
        return true;
    }
}