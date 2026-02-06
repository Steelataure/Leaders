package esiea.hackathon.leaders.application.dto.response;

import java.io.Serializable;

public record LoginResponseDto(
        String token,
        UserDto user) implements Serializable {
}
