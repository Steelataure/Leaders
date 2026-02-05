package esiea.hackathon.leaders.application.dto.response;

import java.util.UUID;

public record PieceResponseDto(
        UUID id,
        String characterId,
        short ownerIndex,
        short q,
        short r,
        boolean hasActedThisTurn
) {}