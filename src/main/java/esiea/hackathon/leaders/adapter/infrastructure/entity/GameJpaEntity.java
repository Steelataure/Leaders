package esiea.hackathon.leaders.adapter.infrastructure.entity;

import esiea.hackathon.leaders.domain.model.enums.GameMode;
import esiea.hackathon.leaders.domain.model.enums.GamePhase;
import esiea.hackathon.leaders.domain.model.enums.GameStatus;
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
    private GameMode mode; // Ton Enum

    @Enumerated(EnumType.STRING)
    private GameStatus status; // Ton Enum

    @Enumerated(EnumType.STRING)
    private GamePhase phase; // Ton Enum

    @Column(name = "current_player_index")
    private int currentPlayerIndex;

    @Column(name = "turn_number")
    private int turnNumber;

    // Relations OneToMany (La Game possède les joueurs et les pièces)

    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude // Important pour éviter boucle infinie
    private List<GamePlayerJpaEntity> players;

    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    private List<PieceJpaEntity> pieces;

    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    private List<RecruitmentCardJpaEntity> cards;
}