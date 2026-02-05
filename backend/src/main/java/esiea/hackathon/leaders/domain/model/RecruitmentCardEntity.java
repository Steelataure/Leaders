package esiea.hackathon.leaders.domain.model;

import esiea.hackathon.leaders.domain.model.enums.CardState;
import lombok.*;

import java.util.UUID;


@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class RecruitmentCardEntity {

    private UUID id;

    @ToString.Exclude
    private GameEntity game;

    private RefCharacterEntity character;
    private CardState state;
    private Integer deckOrder;
    private Integer visibleSlot;
    private Integer recruitedByIndex;
    private Integer bannedByIndex;
}