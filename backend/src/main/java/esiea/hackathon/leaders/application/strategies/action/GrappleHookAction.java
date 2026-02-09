package esiea.hackathon.leaders.application.strategies.action;

import esiea.hackathon.leaders.application.strategies.ActionAbilityStrategy;
import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import org.springframework.stereotype.Component;

import esiea.hackathon.leaders.domain.utils.HexUtils;
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

        boolean isPull = (dest == null);

        // PROTECTION CHECK
        // Only applies if we are PULLING the target (forced movement).
        // Moving towards the target is not a forced movement for the target.
        if (isPull && HexUtils.isProtected(target, allPieces)) {
            throw new IllegalArgumentException("Target is protected by a Royal Guard/Protector!");
        }

        HexCoord sourceCoord = new HexCoord(source.getQ(), source.getR());
        HexCoord targetCoord = new HexCoord(target.getQ(), target.getR());

        // Calcul de la distance
        int dist = HexUtils.getDistance(sourceCoord, targetCoord);

        if (dist <= 1) {
            throw new IllegalArgumentException("Target is too close to grapple (must be non-adjacent)");
        }

        // Vérifier visibilité (chemin libre + alignement)
        if (!HexUtils.isPathClear(sourceCoord, targetCoord, allPieces)) {
            throw new IllegalArgumentException("Path to target is blocked or not in line");
        }

        // Direction unitaire (de source vers target)
        int dq = target.getQ() - source.getQ();
        int dr = target.getR() - source.getR();
        int dirQ = dq / dist;
        int dirR = dr / dist;

        if (dest != null) {
            // === MODE 2: MOVE - Le Grappler se déplace vers la cible ===
            // La destination doit être adjacente à la cible
            if (HexUtils.getDistance(target.getQ(), target.getR(), dest.q(), dest.r()) != 1) {
                throw new IllegalArgumentException("Grappler must land adjacent to target");
            }

            // La destination doit être sur la ligne entre source et target
            // Si on se déplace vers la cible, la case adjacente à la cible sur la ligne est
            // : target - dir
            int targetAdjQ = target.getQ() - dirQ;
            int targetAdjR = target.getR() - dirR;

            if (dest.q() != targetAdjQ || dest.r() != targetAdjR) {
                throw new IllegalArgumentException("Grappler must move strictly towards the target");
            }

            if (HexUtils.isOccupied(dest, allPieces)) {
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

            if (HexUtils.isOccupied(pullDestQ, pullDestR, allPieces)) {
                throw new IllegalArgumentException("Cannot pull: cell adjacent to you is occupied");
            }

            // Déplacer la cible
            target.setQ(pullDestQ);
            target.setR(pullDestR);
        }
    }
}