package esiea.hackathon.leaders.application.dto.response;

import esiea.hackathon.leaders.domain.model.enums.CardState;
import java.util.UUID;

public record CardDto(
        UUID id,
        String characterId,
        CardState state,
        Integer visibleSlot
) {}