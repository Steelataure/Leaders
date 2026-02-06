package esiea.hackathon.leaders.adapter.infrastructure.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "game_player")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class GamePlayerJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Relation ManyToOne : Un joueur appartient à une Game
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id", nullable = false)
    @ToString.Exclude
    private GameJpaEntity game;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "player_index")
    private int playerIndex;

    @Column(name = "is_first_turn_completed")
    private boolean isFirstTurnCompleted;
}
