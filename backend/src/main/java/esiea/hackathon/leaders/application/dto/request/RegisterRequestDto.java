package esiea.hackathon.leaders.application.dto.request;

import java.io.Serializable;

public record RegisterRequestDto(
        String email,
        String password,
        String username) implements Serializable {
}
