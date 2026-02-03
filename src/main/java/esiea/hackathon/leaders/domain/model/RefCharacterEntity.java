package esiea.hackathon.leaders.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class RefCharacterEntity {

    private String id;
    private String name;
    private boolean isLeader;
    private int recruitmentSlots;
    private String description;
    private Set<AbilityEntity> abilities;
}