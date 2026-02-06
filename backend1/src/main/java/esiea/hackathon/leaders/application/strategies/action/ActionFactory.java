package esiea.hackathon.leaders.application.strategies.action;

import esiea.hackathon.leaders.application.strategies.ActionAbilityStrategy;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class ActionFactory {

    private final Map<String, ActionAbilityStrategy> strategies;

    public ActionFactory(List<ActionAbilityStrategy> strategyList) {
        this.strategies = strategyList.stream()
                .collect(Collectors.toMap(ActionAbilityStrategy::getAbilityId, Function.identity()));
    }

    public ActionAbilityStrategy getStrategy(String abilityId) {
        return strategies.get(abilityId);
    }
}