package esiea.hackathon.leaders.application.dto.request;

import esiea.hackathon.leaders.domain.model.HexCoord;
import java.util.UUID;

public record MoveRequestDto(
        UUID pieceId,
        HexCoord destination
) {}