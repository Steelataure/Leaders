package esiea.hackathon.leaders.application.strategies.passive;

import esiea.hackathon.leaders.application.strategies.PassiveAbilityStrategy;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class PassiveFactory {
    private final Map<String, PassiveAbilityStrategy> strategies;

    public PassiveFactory(List<PassiveAbilityStrategy> strategyList) {
        this.strategies = strategyList.stream()
                .collect(Collectors.toMap(PassiveAbilityStrategy::getAbilityId, Function.identity()));
    }

    public <T extends PassiveAbilityStrategy> T getStrategy(String abilityId, Class<T> type) {
        return type.cast(strategies.get(abilityId));
    }
}