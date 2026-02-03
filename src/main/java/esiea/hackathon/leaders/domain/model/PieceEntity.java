package esiea.hackathon.leaders.domain.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PieceEntity {

    private UUID id;

    private UUID gameId;

    private String characterId;
    private Short ownerIndex;
    private Short q; // coordonnée hexagonale axiale
    private Short r; // coordonnée hexagonale axiale
    private Boolean hasActedThisTurn = false;
}