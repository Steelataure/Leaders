package esiea.hackathon.leaders.domain.model;

import esiea.hackathon.leaders.domain.model.enums.GameMode;
import esiea.hackathon.leaders.domain.model.enums.GamePhase;
import esiea.hackathon.leaders.domain.model.enums.GameStatus;
import esiea.hackathon.leaders.domain.model.enums.VictoryType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameEntity {
    private UUID id;
    private GameMode mode;
    private GameStatus status;
    private GamePhase phase;
    private int currentPlayerIndex;
    private int turnNumber;
    private Integer winnerPlayerIndex;
    private VictoryType winnerVictoryType;
    private int banishmentCount;
    private int recruitmentCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private int remainingTimeP0;
    private int remainingTimeP1;
    private Integer eloChangeP0;
    private Integer eloChangeP1;
    private LocalDateTime lastTimerUpdate;
    private Integer scenarioId;
    private esiea.hackathon.leaders.domain.model.enums.AiDifficulty aiDifficulty;
    private List<GamePlayerEntity> players;
    private List<PieceEntity> pieces;
    private List<RecruitmentCardEntity> cards;
}