package esiea.hackathon.leaders.adapter.infrastructure.mappers;

import esiea.hackathon.leaders.adapter.infrastructure.entity.GameJpaEntity;
import esiea.hackathon.leaders.adapter.infrastructure.entity.RecruitmentCardJpaEntity;
import esiea.hackathon.leaders.adapter.infrastructure.entity.RefCharacterJpaEntity;
import esiea.hackathon.leaders.domain.model.GameEntity; // Assure-toi d'avoir cette classe ou adapte
import esiea.hackathon.leaders.domain.model.RecruitmentCardEntity;

public class RecruitmentCardMapper {

    // --- Vers le Domaine ---
    public static RecruitmentCardEntity toDomain(RecruitmentCardJpaEntity entity) {
        if (entity == null) {
            return null;
        }

        // Pour le Game, on fait un mapping simple si GameMapper n'existe pas encore
        // ou si GameEntity est complexe. Ici je suppose un GameEntity simple.
        GameEntity gameDomain = null;
        if (entity.getGame() != null) {
            gameDomain = GameEntity.builder().id(entity.getGame().getId()).build();
        }

        return RecruitmentCardEntity.builder()
                .id(entity.getId())
                .game(gameDomain)
                .character(RefCharacterMapper.toDomain(entity.getCharacter()))
                .state(entity.getState())
                .deckOrder(entity.getDeckOrder())
                .visibleSlot(entity.getVisibleSlot() != null ? Integer.valueOf(entity.getVisibleSlot()) : null)
                .recruitedByIndex(entity.getRecruitedByIndex() != null ? Integer.valueOf(entity.getRecruitedByIndex()) : null)
                .bannedByIndex(entity.getBannedByIndex() != null ? Integer.valueOf(entity.getBannedByIndex()) : null)
                .build();
    }

    // --- Vers l'Infrastructure ---
    public static RecruitmentCardJpaEntity toEntity(RecruitmentCardEntity domain) {
        if (domain == null) {
            return null;
        }

        // Construction manuelle de la référence JPA Game (Proxy)
        GameJpaEntity gameRef = null;
        if (domain.getGame() != null && domain.getGame().getId() != null) {
            gameRef = GameJpaEntity.builder().id(domain.getGame().getId()).build();
        }

        // Construction manuelle de la référence JPA Character (Proxy ou complet)
        // Ici, comme on a le mapper, on peut soit mapper tout l'objet,
        // soit juste mettre l'ID si on veut seulement la référence.
        // Pour la sauvegarde, mettre l'ID suffit souvent, mais utilisons le mapper pour être sûr.
        RefCharacterJpaEntity charRef = null;
        if (domain.getCharacter() != null) {
            // Option A : Mapping complet (plus lourd mais sûr)
            charRef = RefCharacterMapper.toEntity(domain.getCharacter());

            // Option B (Optimisée) : Si tu veux juste la référence par ID :
            // charRef = RefCharacterJpaEntity.builder().id(domain.getCharacter().getId()).build();
        }

        return RecruitmentCardJpaEntity.builder()
                .id(domain.getId())
                .game(gameRef)
                .character(charRef)
                .state(domain.getState())
                .deckOrder(domain.getDeckOrder())
                // Conversion Integer Domain -> Short Infra
                .visibleSlot(domain.getVisibleSlot() != null ? domain.getVisibleSlot().shortValue() : null)
                .recruitedByIndex(domain.getRecruitedByIndex() != null ? domain.getRecruitedByIndex().shortValue() : null)
                .bannedByIndex(domain.getBannedByIndex() != null ? domain.getBannedByIndex().shortValue() : null)
                .build();
    }
}