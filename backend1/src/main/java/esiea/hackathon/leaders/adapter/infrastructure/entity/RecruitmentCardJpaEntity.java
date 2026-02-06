package esiea.hackathon.leaders.adapter.infrastructure.entity;

import esiea.hackathon.leaders.domain.model.enums.CardState;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "recruitment_card")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecruitmentCardJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private GameJpaEntity game;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "character_id", nullable = false)
    private RefCharacterJpaEntity character;

    // --- CHAMPS SIMPLES ---

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CardState state; // IN_DECK, VISIBLE, etc.

    @Column(name = "deck_order")
    private Integer deckOrder; // Integer pour gérer le NULL (si pas dans la pioche)

    @Column(name = "visible_slot")
    private Short visibleSlot; // 1, 2 ou 3. Short correspond au SMALLINT SQL

    @Column(name = "recruited_by_index")
    private Short recruitedByIndex; // 0 ou 1. Nullable.

    @Column(name = "banned_by_index")
    private Short bannedByIndex; // 0 ou 1. Nullable.
}
