package esiea.hackathon.leaders.application.strategies.passive;

import esiea.hackathon.leaders.application.strategies.PassiveAbilityStrategy;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.stereotype.Component;

@Component
public class JailerBlockStrategy implements PassiveAbilityStrategy {

    private static final Logger LOGGER = LogManager.getLogger(JailerBlockStrategy.class);

    @Override
    public String getAbilityId() { return "JAILER_BLOCK"; }

    public boolean isBlocking(PieceEntity jailer, PieceEntity enemy) {
        // Si l'ennemi est adjacent, il est bloqué
        boolean isBlocking = areAdjacent(jailer, enemy);
        if (isBlocking) {
            LOGGER.info("Capacité {} activée : Le Geôlier {} bloque l'ennemi {}", 
                getAbilityId(), jailer.getId(), enemy.getId());
        }
        return isBlocking;
    }

    private boolean areAdjacent(PieceEntity p1, PieceEntity p2) {
        int dq = Math.abs(p1.getQ() - p2.getQ());
        int dr = Math.abs(p1.getR() - p2.getR());
        int ds = Math.abs((p1.getQ() + p1.getR()) - (p2.getQ() + p2.getR()));
        
        int distance = (dq + dr + ds) / 2;
        
        LOGGER.debug("Calcul de distance entre {} et {} : {}", p1.getId(), p2.getId(), distance);
        
        return distance == 1;
    }
}