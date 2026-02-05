package esiea.hackathon.leaders.adapter.infrastructure.mappers;

import esiea.hackathon.leaders.adapter.infrastructure.entity.RefCharacterJpaEntity;
import esiea.hackathon.leaders.domain.model.RefCharacterEntity;

import java.util.Collections;
import java.util.stream.Collectors;

public class RefCharacterMapper {

    // --- Vers le Domaine ---
    public static RefCharacterEntity toDomain(RefCharacterJpaEntity entity) {
        if (entity == null) {
            return null;
        }

        return RefCharacterEntity.builder()
                .id(entity.getId())
                .name(entity.getName())
                .isLeader(entity.isLeader())
                .recruitmentSlots(entity.getRecruitmentSlots())
                .description(entity.getDescription())
                .abilities(entity.getAbilities() == null ? Collections.emptySet() :
                        entity.getAbilities().stream()
                                .map(AbilityMapper::toDomain)
                                .collect(Collectors.toSet()))
                .build();
    }

    // --- Vers l'Infrastructure ---
    public static RefCharacterJpaEntity toEntity(RefCharacterEntity domain) {
        if (domain == null) {
            return null;
        }

        return RefCharacterJpaEntity.builder()
                .id(domain.getId())
                .name(domain.getName())
                .isLeader(domain.isLeader())
                .recruitmentSlots(domain.getRecruitmentSlots())
                .description(domain.getDescription())
                // Conversion inverse
                .abilities(domain.getAbilities() == null ? Collections.emptySet() :
                        domain.getAbilities().stream()
                                .map(AbilityMapper::toEntity)
                                .collect(Collectors.toSet()))
                .build();
    }
}