package esiea.hackathon.leaders.application.strategies.action;

import esiea.hackathon.leaders.application.strategies.ActionAbilityStrategy;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class ActionFactory {

    private static final Logger LOGGER = LogManager.getLogger(ActionFactory.class);

    private final Map<String, ActionAbilityStrategy> strategies;

    public ActionFactory(List<ActionAbilityStrategy> strategyList) {
        this.strategies = strategyList.stream()
                .collect(Collectors.toMap(ActionAbilityStrategy::getAbilityId, Function.identity()));
        
        LOGGER.info("Initialisation de ActionFactory avec {} stratégies chargées.", strategies.size());
    }

    public ActionAbilityStrategy getStrategy(String abilityId) {
        ActionAbilityStrategy strategy = strategies.get(abilityId);
        
        if (strategy == null) {
            LOGGER.warn("Aucune stratégie trouvée pour l'identifiant de capacité : {}", abilityId);
        } else {
            LOGGER.debug("Récupération de la stratégie pour : {}", abilityId);
        }
        
        return strategy;
    }
}