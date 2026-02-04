package esiea.hackathon.leaders.application.dto.response;

import esiea.hackathon.leaders.domain.model.enums.GameStatus;
import esiea.hackathon.leaders.domain.model.enums.GamePhase;
import java.util.List;
import java.util.UUID;

public record GameStateDto(
        UUID gameId,
        GameStatus status,
        GamePhase currentPhase,     // ACTION ou RECRUITMENT
        int currentPlayerIndex,     // 0 ou 1 (int car ton entité utilise int)
        int turnNumber,             // Utile pour le front (règle du tour 1 joueur 2)
        List<PieceDto> pieces,
        List<CardDto> river
) {}