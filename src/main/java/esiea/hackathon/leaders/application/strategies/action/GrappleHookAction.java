package esiea.hackathon.leaders.application.strategies.actions;

import esiea.hackathon.leaders.application.strategies.ActionAbilityStrategy;
import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class GrappleHookAction implements ActionAbilityStrategy {

    @Override
    public String getAbilityId() {
        return "GRAPPLE_HOOK";
    }

    @Override
    public void execute(PieceEntity source, PieceEntity target, HexCoord dest, List<PieceEntity> allPieces) {
        if (target == null) throw new IllegalArgumentException("Target required for Grapple");

        // 1. Calcul du vecteur inverse (Target -> Source)
        int dq = source.getQ() - target.getQ();
        int dr = source.getR() - target.getR();
        int dist = (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;

        if (dist <= 1) {
            throw new IllegalArgumentException("Target is too close to grapple");
        }

        // 2. Trouver la case adjacente à la Source, en direction de la Target.
        // On divise le vecteur par la distance pour obtenir une direction unitaire (approximative sur grille hex)
        int dirQ = dq / dist;
        int dirR = dr / dist;

        // La case d'arrivée est "Source - 1 pas vers Target" ? Non, c'est "Source + 1 pas vers Target"
        // Le vecteur dq allait de Target à Source. Donc on recule de Source vers Target.
        short destQ = (short) (source.getQ() - dirQ);
        short destR = (short) (source.getR() - dirR);

        // 3. Validation
        if (isOccupied(destQ, destR, allPieces)) {
            throw new IllegalArgumentException("Cannot pull: cell adjacent to you is occupied");
        }

        // 4. Déplacement de la cible
        target.setQ(destQ);
        target.setR(destR);
    }

    private boolean isOccupied(short q, short r, List<PieceEntity> pieces) {
        return pieces.stream().anyMatch(p -> p.getQ() == q && p.getR() == r);
    }
}