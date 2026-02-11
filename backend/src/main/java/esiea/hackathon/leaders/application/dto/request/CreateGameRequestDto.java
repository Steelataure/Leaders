package esiea.hackathon.leaders.application.dto.request;

import java.util.List;

public record CreateGameRequestDto(
        java.util.UUID gameId,
        List<String> forcedDeck, // Liste ordonnée des IDs (ex: ["ARCHER", "CAVALRY"...])
        Integer scenarioId) {
}