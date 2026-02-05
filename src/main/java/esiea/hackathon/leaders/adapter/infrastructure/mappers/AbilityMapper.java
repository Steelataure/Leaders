package esiea.hackathon.leaders.adapter.infrastructure.mappers;

import esiea.hackathon.leaders.adapter.infrastructure.entity.AbilityJpaEntity;
import esiea.hackathon.leaders.domain.model.AbilityEntity;

public class AbilityMapper {

    public static AbilityEntity toDomain(AbilityJpaEntity entity) {
        if (entity == null) {
            return null;
        }
        return AbilityEntity.builder()
                .id(entity.getId())
                .name(entity.getName())
                .abilityType(entity.getAbilityType())
                .description(entity.getDescription())
                .build();
    }

    public static AbilityJpaEntity toEntity(AbilityEntity domain) {
        if (domain == null) {
            return null;
        }
        return AbilityJpaEntity.builder()
                .id(domain.getId())
                .name(domain.getName())
                .abilityType(domain.getAbilityType())
                .description(domain.getDescription())
                .build();
    }
}