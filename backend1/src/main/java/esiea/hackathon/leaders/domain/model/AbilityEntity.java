package esiea.hackathon.leaders.domain.model;

import esiea.hackathon.leaders.domain.model.enums.AbilityType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AbilityEntity {

    private String id; // Ex: 'JUMP' (Pas de génération auto ici)
    private String name;
    private AbilityType abilityType;
    private String description;
}