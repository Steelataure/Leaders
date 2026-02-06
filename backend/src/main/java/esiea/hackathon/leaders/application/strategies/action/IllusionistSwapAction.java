package esiea.hackathon.leaders.application.strategies.action;

import esiea.hackathon.leaders.application.strategies.ActionAbilityStrategy;
import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.stereotype.Component;
import java.util.List;

@Component("illusionistSwapAction")
public class IllusionistSwapAction implements ActionAbilityStrategy {

    private static final Logger LOGGER = LogManager.getLogger(IllusionistSwapAction.class);

    @Override
    public String getAbilityId() { return "ILLUSIONIST_SWAP"; }

    @Override
    public void execute(PieceEntity source, PieceEntity target, HexCoord dest, List<PieceEntity> allPieces) {
        if (target == null) {
            LOGGER.error("Échec de l'action : La cible (target) est nulle.");
            throw new IllegalArgumentException("Target required for Swap");
        }

        // RÈGLE 1 : Non-Adjacent (Distance > 1)
        if (getDistance(source, target) <= 1) {
            LOGGER.error("Échec de l'action : La cible à la position ({}, {}) est adjacente.", target.getQ(), target.getR());
            throw new IllegalArgumentException("Target must be non-adjacent (distance > 1)");
        }

        // RÈGLE 2 : Ligne de Vue (Alignés sur Q, R ou S)
        if (!isInLineOfSight(source, target)) {
            LOGGER.error("Échec de l'action : Pas de ligne de vue entre ({}, {}) et ({}, {}).", 
                         source.getQ(), source.getR(), target.getQ(), target.getR());
            throw new IllegalArgumentException("Target must be visible in a straight line");
        }

        // Action : Echange
        LOGGER.info("Exécution de l'échange entre l'entité {} et l'entité {}.", source.getId(), target.getId());
        
        short tempQ = source.getQ();
        short tempR = source.getR();

        source.setQ(target.getQ());
        source.setR(target.getR());

        target.setQ(tempQ);
        target.setR(tempR);

        LOGGER.info("Échange terminé avec succès. Nouvelles coordonnées source: ({}, {}), cible: ({}, {}).", 
                    source.getQ(), source.getR(), target.getQ(), target.getR());
    }

    private int getDistance(PieceEntity p1, PieceEntity p2) {
        return (Math.abs(p1.getQ() - p2.getQ())
                + Math.abs(p1.getR() - p2.getR())
                + Math.abs((p1.getQ() + p1.getR()) - (p2.getQ() + p2.getR()))) / 2;
    }

    private boolean isInLineOfSight(PieceEntity p1, PieceEntity p2) {
        return p1.getQ() == p2.getQ()
                || p1.getR() == p2.getR()
                || (p1.getQ() + p1.getR()) == (p2.getQ() + p2.getR());
    }
}