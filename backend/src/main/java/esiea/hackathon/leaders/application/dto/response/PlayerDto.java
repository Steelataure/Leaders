package esiea.hackathon.leaders.application.dto.response;

import java.util.UUID;

public record PlayerDto(
        UUID userId,
        int playerIndex) {
}
