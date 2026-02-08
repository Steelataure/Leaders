package esiea.hackathon.leaders.application.dto.response;

import java.util.UUID;

public record PieceDto(
        UUID id,
        String characterId,
        int ownerIndex,
        short q,
        short r,
        boolean hasActed
) {}