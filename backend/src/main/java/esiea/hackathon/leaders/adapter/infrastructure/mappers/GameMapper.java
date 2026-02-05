package esiea.hackathon.leaders.adapter.infrastructure.mappers;

import esiea.hackathon.leaders.adapter.infrastructure.entity.GameJpaEntity;
import esiea.hackathon.leaders.domain.model.GameEntity;

public class GameMapper {

    public static GameEntity toDomain(GameJpaEntity entity) {
        if (entity == null) return null;

        return GameEntity.builder()
                .id(entity.getId())
                .mode(entity.getMode())
                .status(entity.getStatus())
                .phase(entity.getPhase())
                .currentPlayerIndex(entity.getCurrentPlayerIndex())
                .turnNumber(entity.getTurnNumber())
                .banishmentCount(entity.getBanishmentCount())
                .winnerPlayerIndex(entity.getWinnerPlayerIndex())
                .winnerVictoryType(entity.getWinnerVictoryType())
                .build();
    }

    public static GameJpaEntity toEntity(GameEntity domain) {
        if (domain == null) return null;

        return GameJpaEntity.builder()
                .id(domain.getId())
                .mode(domain.getMode())      // <--- TRANSFERT CRUCIAL
                .status(domain.getStatus())  // <--- TRANSFERT CRUCIAL
                .phase(domain.getPhase())    // <--- TRANSFERT CRUCIAL
                .currentPlayerIndex(domain.getCurrentPlayerIndex())
                .turnNumber(domain.getTurnNumber())
                .banishmentCount(domain.getBanishmentCount())
                .winnerPlayerIndex(domain.getWinnerPlayerIndex())
                .winnerVictoryType(domain.getWinnerVictoryType())
                .build();
    }
}