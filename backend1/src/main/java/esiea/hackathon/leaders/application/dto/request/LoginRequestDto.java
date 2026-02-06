package esiea.hackathon.leaders.application.dto.request;

import java.io.Serializable;

public record LoginRequestDto(
        String email,
        String password) implements Serializable {
}
