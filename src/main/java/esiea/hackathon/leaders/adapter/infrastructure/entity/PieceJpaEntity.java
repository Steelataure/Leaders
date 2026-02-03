package esiea.hackathon.leaders.adapter.infrastructure.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "piece", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"game_id", "q", "r"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PieceJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id", nullable = false)
    @ToString.Exclude // Important : Coupe la boucle infinie des logs
    private GameJpaEntity game;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "character_id", nullable = false)
    private RefCharacterJpaEntity character;

    @Column(name = "owner_index", nullable = false)
    private Short ownerIndex;

    @Column(nullable = false)
    private Short q;

    @Column(nullable = false)
    private Short r;

    @Column(name = "has_acted_this_turn")
    private Boolean hasActedThisTurn;
}