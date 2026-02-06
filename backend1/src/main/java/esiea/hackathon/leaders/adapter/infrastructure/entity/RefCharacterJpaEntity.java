package esiea.hackathon.leaders.adapter.infrastructure.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Entity
@Table(name = "ref_character")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class RefCharacterJpaEntity {

    @Id
    @Column(length = 30)
    private String id; // 'ARCHER', 'LEADER'

    private String name;

    @Column(name = "is_leader")
    private boolean isLeader;

    @Column(name = "recruitment_slots")
    private int recruitmentSlots;

    @Column(columnDefinition = "TEXT")
    private String description;

    // Relation N:N vers les compétences
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "ref_character_ability",
            joinColumns = @JoinColumn(name = "character_id"),
            inverseJoinColumns = @JoinColumn(name = "ability_id")
    )
    private Set<AbilityJpaEntity> abilities;
}
