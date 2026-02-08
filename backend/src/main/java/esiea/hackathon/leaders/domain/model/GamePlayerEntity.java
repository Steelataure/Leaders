package esiea.hackathon.leaders.domain.model;

import lombok.*;

import java.util.UUID;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class GamePlayerEntity {

    private UUID id;

    @ToString.Exclude // Evite boucle infinie Lombok
    private GameEntity game;

    private UUID userId; // Peut être null pour IA
    private int playerIndex; // 0 ou 1
    private boolean isFirstTurnCompleted;
}