package esiea.hackathon.leaders.application.strategies.movement;

import esiea.hackathon.leaders.application.strategies.MoveAbilityStrategy;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class MoveStrategyFactory {

    private static final Logger LOGGER = LogManager.getLogger(MoveStrategyFactory.class);

    private final Map<String, MoveAbilityStrategy> strategies;

    public MoveStrategyFactory(List<MoveAbilityStrategy> strategyList) {
        LOGGER.info("Initialisation de MoveStrategyFactory avec {} stratégies.", strategyList.size());
        this.strategies = strategyList.stream()
                .collect(Collectors.toMap(MoveAbilityStrategy::getAbilityId, Function.identity()));
        LOGGER.debug("Stratégies chargées : {}", strategies.keySet());
    }

    /**
     * Récupère la stratégie associée à un ID. Retourne null si aucune stratégie n'existe (ex: pour les passifs).
     */
    public MoveAbilityStrategy getStrategy(String abilityId) {
        MoveAbilityStrategy strategy = strategies.get(abilityId);
        
        if (strategy == null) {
            LOGGER.warn("Aucune stratégie trouvée pour l'ID d'aptitude : {}", abilityId);
        } else {
            LOGGER.debug("Stratégie récupérée pour l'ID : {}", abilityId);
        }
        
        return strategy;
    }
}