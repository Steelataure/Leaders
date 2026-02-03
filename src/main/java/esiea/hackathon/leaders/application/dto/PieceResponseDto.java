package esiea.hackathon.leaders.application.dto;

import java.util.UUID;

public record PieceResponseDto(
        UUID id,
        String characterId,
        short ownerIndex,
        short q,
        short r,
        boolean hasActedThisTurn
) {}