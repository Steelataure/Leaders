package esiea.hackathon.leaders.adapter.infrastructure.entity;

import esiea.hackathon.leaders.domain.model.enums.GameMode;
import esiea.hackathon.leaders.domain.model.enums.GamePhase;
import esiea.hackathon.leaders.domain.model.enums.GameStatus;
import esiea.hackathon.leaders.domain.model.enums.VictoryType;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "game")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameJpaEntity {

    @Id
    private UUID id;

    @Enumerated(EnumType.STRING)
    private GameMode mode;

    @Enumerated(EnumType.STRING)
    private GameStatus status;

    @Enumerated(EnumType.STRING)
    private GamePhase phase;

    @Column(name = "current_player_index")
    private int currentPlayerIndex;

    @Column(name = "turn_number")
    private int turnNumber;

    @Column(name = "banishment_count")
    private int banishmentCount;

    @Column(name = "recruitment_count")
    private int recruitmentCount;

    @Column(name = "winner_player_index")
    private Integer winnerPlayerIndex;

    @Enumerated(EnumType.STRING)
    @Column(name = "winner_victory_type")
    private VictoryType winnerVictoryType;

    @Column(name = "remaining_time_p0")
    @Builder.Default
    private int remainingTimeP0 = 420;

    @Column(name = "remaining_time_p1")
    @Builder.Default
    private int remainingTimeP1 = 420;

    @Column(name = "elo_change_p0")
    private Integer eloChangeP0;

    @Column(name = "elo_change_p1")
    private Integer eloChangeP1;

    @Column(name = "scenario_id")
    private Integer scenarioId;

    @Column(name = "last_timer_update")
    private java.time.LocalDateTime lastTimerUpdate;

    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<RecruitmentCardJpaEntity> cards;

    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<PieceJpaEntity> pieces;

    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<GamePlayerJpaEntity> players;
}