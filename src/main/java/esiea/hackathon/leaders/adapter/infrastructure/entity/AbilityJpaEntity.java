package esiea.hackathon.leaders.adapter.infrastructure.entity;

import esiea.hackathon.leaders.domain.model.enums.AbilityType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "ability")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AbilityJpaEntity {
    @Id
    @Column(length = 30)
    private String id;

    private String name;

    @Column(name = "ability_type")
    @Enumerated(EnumType.STRING)
    private AbilityType abilityType; // Ton Enum

    private String description;
}
