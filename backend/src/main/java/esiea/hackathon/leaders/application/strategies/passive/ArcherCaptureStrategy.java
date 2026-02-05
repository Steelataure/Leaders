package esiea.hackathon.leaders.application.strategies.passive;

import esiea.hackathon.leaders.application.strategies.PassiveAbilityStrategy;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.stereotype.Component;

@Component
public class ArcherCaptureStrategy implements PassiveAbilityStrategy {

    private static final Logger LOGGER = LogManager.getLogger(ArcherCaptureStrategy.class);

    @Override
    public String getAbilityId() { 
        return "ARCHER_RANGE"; 
    }

    public boolean canHelpCapture(PieceEntity archer, PieceEntity target) {
        LOGGER.info("Vérification de l'aide à la capture pour l'archer {} sur la cible {}", archer.getId(), target.getId());
        
        int dist = getDistance(archer, target);
        
        // Participe si distance == 2, mais pas si adjacent (dist == 1)
        boolean result = (dist == 2);
        
        if (result) {
            LOGGER.debug("L'archer peut aider : distance optimale de 2 détectée.");
        } else {
            LOGGER.debug("L'archer ne peut pas aider : distance calculée = {}", dist);
        }
        
        return result;
    }

    private int getDistance(PieceEntity p1, PieceEntity p2) {
        int distance = (Math.abs(p1.getQ() - p2.getQ())
                + Math.abs(p1.getR() - p2.getR())
                + Math.abs((p1.getQ()+p1.getR()) - (p2.getQ()+p2.getR()))) / 2;
        
        LOGGER.trace("Calcul de distance hexagonale : {}", distance);
        return distance;
    }
}