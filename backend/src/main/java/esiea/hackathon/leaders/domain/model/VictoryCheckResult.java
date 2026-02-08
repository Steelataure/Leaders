package esiea.hackathon.leaders.domain.model;

import esiea.hackathon.leaders.domain.model.enums.VictoryType;

public record VictoryCheckResult(
        boolean isGameOver,
        Integer winnerPlayerIndex,
        VictoryType victoryType
) {
    // Constructeur statique pour "Pas de victoire"
    public static VictoryCheckResult noVictory() {
        return new VictoryCheckResult(false, null, null);
    }

    // Constructeur statique pour "Victoire"
    public static VictoryCheckResult victory(int winnerIndex, VictoryType type) {
        return new VictoryCheckResult(true, winnerIndex, type);
    }
}