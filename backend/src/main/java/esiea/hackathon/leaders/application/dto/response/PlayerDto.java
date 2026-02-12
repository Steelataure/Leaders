package esiea.hackathon.leaders.application.dto.response;

import java.util.UUID;

public record PlayerDto(
        UUID userId,
        String username,
        Integer elo,
        Integer eloChange,
        String avatar,
        int playerIndex) {
}
