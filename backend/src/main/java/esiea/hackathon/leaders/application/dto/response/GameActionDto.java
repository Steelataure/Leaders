package esiea.hackathon.leaders.application.dto.response;

import esiea.hackathon.leaders.domain.model.enums.ActionType;
import java.util.UUID;

public record GameActionDto(
        int turnNumber,
        int playerIndex,
        ActionType actionType,
        UUID pieceId,
        Integer fromQ,
        Integer fromR,
        Integer toQ,
        Integer toR,
        UUID targetPieceId,
        String abilityId, // Only ID needed for frontend
        String characterId // Only ID needed
) {
}
