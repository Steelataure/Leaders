package esiea.hackathon.leaders.domain.model;

import lombok.*;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PieceEntity {

    private UUID id;

    private UUID gameId;

    private String characterId;
    private Short ownerIndex;
    private Short q; // coordonnée hexagonale axiale
    private Short r; // coordonnée hexagonale axiale
    @Builder.Default
    private Boolean hasActedThisTurn = false;
}