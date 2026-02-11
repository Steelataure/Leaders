package esiea.hackathon.leaders.application.dto.request;

import esiea.hackathon.leaders.domain.model.HexCoord;
import java.util.UUID;

public record ActionRequestDto(
        UUID sourceId,
        UUID targetId, // Peut être null selon le pouvoir
        String abilityId,
        HexCoord destination, // Peut être null
        HexCoord secondaryDestination, // Ajout pour choix multiples (ex: BRAWLER)
        UUID playerId) {
}