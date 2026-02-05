package esiea.hackathon.leaders.application.strategies.actions;

import esiea.hackathon.leaders.application.strategies.ActionAbilityStrategy;
import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class GrappleHookAction implements ActionAbilityStrategy {

    private static final Logger LOGGER = LogManager.getLogger(GrappleHookAction.class);

    @Override
    public String getAbilityId() {
        return "GRAPPLE_HOOK";
    }

    @Override
    public void execute(PieceEntity source, PieceEntity target, HexCoord dest, List<PieceEntity> allPieces) {
        LOGGER.info("Exécution de la compétence GRAPPLE_HOOK par la pièce ID: {} sur la cible ID: {}", 
                source.getId(), (target != null ? target.getId() : "null"));

        if (target == null) {
            LOGGER.error("Échec de l'action : La cible est manquante (null)");
            throw new IllegalArgumentException("Target required for Grapple");
        }

        // 1. Calcul du vecteur inverse (Target -> Source)
        int dq = source.getQ() - target.getQ();
        int dr = source.getR() - target.getR();
        int dist = (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;

        LOGGER.debug("Calcul de distance hexadécimale : {}", dist);

        if (dist <= 1) {
            LOGGER.warn("Échec de l'action : La cible (dist={}) est trop proche pour utiliser le grappin", dist);
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
            LOGGER.warn("Échec du déplacement : La case de destination ({}, {}) est déjà occupée", destQ, destR);
            throw new IllegalArgumentException("Cannot pull: cell adjacent to you is occupied");
        }

        // 4. Déplacement de la cible
        LOGGER.info("Déplacement de la cible réussi vers les coordonnées ({}, {})", destQ, destR);
        target.setQ(destQ);
        target.setR(destR);
    }

    private boolean isOccupied(short q, short r, List<PieceEntity> pieces) {
        return pieces.stream().anyMatch(p -> p.getQ() == q && p.getR() == r);
    }
}