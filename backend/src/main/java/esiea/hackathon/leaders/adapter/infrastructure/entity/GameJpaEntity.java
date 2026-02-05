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
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class GameJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
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

    @Column(name = "winner_player_index")
    private Integer winnerPlayerIndex;

    @Enumerated(EnumType.STRING)
    @Column(name = "winner_victory_type")
    private VictoryType winnerVictoryType;

    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL)
    @ToString.Exclude
    private List<RecruitmentCardJpaEntity> cards;

    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL)
    @ToString.Exclude
    private List<PieceJpaEntity> pieces;
}