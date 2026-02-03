package esiea.hackathon.leaders.domain.model;

import esiea.hackathon.leaders.domain.model.enums.ActionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class GameActionEntity {

    private UUID id;
    private GameEntity game;
    private int turnNumber;
    private int playerIndex;
    private int actionOrder;
    private ActionType actionType;
    private UUID pieceId; // On stocke juste l'ID au cas où la pièce est détruite plus tard
    private Integer fromQ;
    private Integer fromR;
    private Integer toQ;
    private Integer toR;
    private UUID targetPieceId;
    private AbilityEntity ability;
    private RefCharacterEntity character; // Pour Recrutement/Ban
    private LocalDateTime createdAt;
}