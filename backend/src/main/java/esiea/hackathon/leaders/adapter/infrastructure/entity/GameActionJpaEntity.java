package esiea.hackathon.leaders.adapter.infrastructure.entity;

import esiea.hackathon.leaders.domain.model.enums.ActionType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "game_action")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class GameActionJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // --- RELATION FORTE (Le parent) ---
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private GameJpaEntity game;

    // --- DONNÉES DE TOUR ---
    @Column(name = "turn_number", nullable = false)
    private int turnNumber;

    @Column(name = "player_index", nullable = false)
    private int playerIndex;

    @Column(name = "action_order", nullable = false)
    private int actionOrder;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false)
    private ActionType actionType;

    // --- CIBLES (IDs simples pour découplage historique) ---
    @Column(name = "piece_id")
    private UUID pieceId;

    @Column(name = "target_piece_id")
    private UUID targetPieceId;

    // --- COORDONNÉES ---
    @Column(name = "from_q")
    private Integer fromQ;
    @Column(name = "from_r")
    private Integer fromR;
    @Column(name = "to_q")
    private Integer toQ;
    @Column(name = "to_r")
    private Integer toR;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ability_id")
    @ToString.Exclude
    private AbilityJpaEntity ability;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "character_id")
    @ToString.Exclude
    private RefCharacterJpaEntity character;

    // --- METADATA ---
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
