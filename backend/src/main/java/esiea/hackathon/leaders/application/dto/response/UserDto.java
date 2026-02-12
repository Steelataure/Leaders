package esiea.hackathon.leaders.application.dto.response;

import java.io.Serializable;
import java.util.List;
import java.util.UUID;

public record UserDto(
        UUID id,
        String email,
        String username,
        int elo,
        String avatar,
        List<String> roles) implements Serializable {
}
