package esiea.hackathon.leaders.application.strategies.passive;

import esiea.hackathon.leaders.application.strategies.PassiveAbilityStrategy;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.stereotype.Component;

@Component
public class AssassinSoloStrategy implements PassiveAbilityStrategy {

    private static final Logger LOGGER = LogManager.getLogger(AssassinSoloStrategy.class);

    @Override
    public String getAbilityId() { 
        return "ASSASSIN_SOLO"; 
    }

    public boolean canCaptureLeaderAlone(PieceEntity assassin, PieceEntity enemyLeader) {
        LOGGER.info("Vérification de la capacité de capture en solo pour l'assassin : {}", assassin.getId());
        
        // La logique actuelle retourne toujours vrai pour cette stratégie passive
        boolean result = true;
        
        if (result) {
            LOGGER.debug("L'assassin {} peut capturer le leader ennemi {} seul.", assassin.getId(), enemyLeader.getId());
        }

        return result;
    }
}