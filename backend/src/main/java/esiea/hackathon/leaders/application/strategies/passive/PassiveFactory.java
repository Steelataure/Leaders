package esiea.hackathon.leaders.application.strategies.passive;

import esiea.hackathon.leaders.application.strategies.PassiveAbilityStrategy;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class PassiveFactory {
    
    private static final Logger LOGGER = LogManager.getLogger(PassiveFactory.class);
    private final Map<String, PassiveAbilityStrategy> strategies;

    public PassiveFactory(List<PassiveAbilityStrategy> strategyList) {
        LOGGER.info("Initialisation de PassiveFactory avec {} stratégies.", strategyList.size());
        this.strategies = strategyList.stream()
                .collect(Collectors.toMap(PassiveAbilityStrategy::getAbilityId, Function.identity()));
        LOGGER.debug("Stratégies chargées : {}", strategies.keySet());
    }

    public <T extends PassiveAbilityStrategy> T getStrategy(String abilityId, Class<T> type) {
        LOGGER.debug("Récupération de la stratégie pour l'ID : {}", abilityId);
        
        PassiveAbilityStrategy strategy = strategies.get(abilityId);
        
        if (strategy == null) {
            LOGGER.warn("Aucune stratégie trouvée pour l'ID : {}", abilityId);
            return null;
        }

        try {
            return type.cast(strategy);
        } catch (ClassCastException e) {
            LOGGER.error("Impossible de caster la stratégie {} vers le type {}", abilityId, type.getSimpleName());
            throw e;
        }
    }
}