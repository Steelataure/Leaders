package esiea.hackathon.leaders.application.strategies.passive;

import esiea.hackathon.leaders.application.strategies.PassiveAbilityStrategy;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.stereotype.Component;

@Component
public class ProtectorShieldStrategy implements PassiveAbilityStrategy {

    private static final Logger LOGGER = LogManager.getLogger(ProtectorShieldStrategy.class);

    @Override
    public String getAbilityId() { 
        return "PROTECTOR_SHIELD"; 
    }

    public boolean isProtecting(PieceEntity protector, PieceEntity target) {
        LOGGER.debug("Vérification de la protection : Protecteur={} -> Cible={}", protector.getId(), target.getId());
        
        // Protège si la cible est lui-même OU un allié adjacent
        boolean isSelf = protector.getId().equals(target.getId());
        boolean adjacent = areAdjacent(protector, target);
        
        if (isSelf || adjacent) {
            LOGGER.info("Bouclier activé pour la cible {} par le protecteur {}", target.getId(), protector.getId());
            return true;
        }

        return false;
    }

    private boolean areAdjacent(PieceEntity p1, PieceEntity p2) {
        int dist = (Math.abs(p1.getQ() - p2.getQ())
                + Math.abs(p1.getR() - p2.getR())
                + Math.abs((p1.getQ()+p1.getR()) - (p2.getQ()+p2.getR()))) / 2;
        
        LOGGER.trace("Calcul de distance entre {} et {} : {}", p1.getId(), p2.getId(), dist);
        return dist == 1;
    }
}