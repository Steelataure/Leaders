package esiea.hackathon.leaders.domain.model;

import esiea.hackathon.leaders.domain.model.enums.GameMode;
import esiea.hackathon.leaders.domain.model.enums.GamePhase;
import esiea.hackathon.leaders.domain.model.enums.GameStatus;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;


@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class GameEntity {

    private UUID id;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private GameMode mode = GameMode.CLASSIC;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private GameStatus status = GameStatus.WAITING;

    private GamePhase phase = GamePhase.ACTION;
    private int currentPlayerIndex;
    private int turnNumber;
    private Integer winnerPlayerIndex; // Nullable
    private int banishmentCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<GamePlayerEntity> players;
    private List<PieceEntity> pieces;
    private List<RecruitmentCardEntity> cards;
}