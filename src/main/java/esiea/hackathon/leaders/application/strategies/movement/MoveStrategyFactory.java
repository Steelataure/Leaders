package esiea.hackathon.leaders.application.strategies.movement;

import esiea.hackathon.leaders.application.strategies.MoveAbilityStrategy;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class MoveStrategyFactory {

    private final Map<String, MoveAbilityStrategy> strategies;

    public MoveStrategyFactory(List<MoveAbilityStrategy> strategyList) {
        this.strategies = strategyList.stream()
                .collect(Collectors.toMap(MoveAbilityStrategy::getAbilityId, Function.identity()));
    }

    /**
     * Récupère la stratégie associée à un ID. Retourne null si aucune stratégie n'existe (ex: pour les passifs).
     */
    public MoveAbilityStrategy getStrategy(String abilityId) {
        return strategies.get(abilityId);
    }
}