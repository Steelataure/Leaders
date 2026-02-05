package esiea.hackathon.leaders.application.dto.request;

import java.util.List;

public record CreateGameRequestDto(
        List<String> forcedDeck // Liste ordonnée des IDs (ex: ["ARCHER", "CAVALRY"...])
) {}