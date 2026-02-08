package esiea.hackathon.leaders.adapter.infrastructure.mappers;

import esiea.hackathon.leaders.adapter.infrastructure.entity.GameJpaEntity;
import esiea.hackathon.leaders.domain.model.GameEntity;
import esiea.hackathon.leaders.domain.model.GamePlayerEntity;

import java.util.List;
import java.util.stream.Collectors;

public class GameMapper {

    public static GameEntity toDomain(GameJpaEntity entity) {
        if (entity == null)
            return null;

        List<GamePlayerEntity> players = null;
        if (entity.getPlayers() != null) {
            players = entity.getPlayers().stream()
                    .map(p -> GamePlayerEntity.builder()
                            .id(p.getId())
                            .userId(p.getUserId())
                            .playerIndex(p.getPlayerIndex())
                            .isFirstTurnCompleted(p.isFirstTurnCompleted())
                            .build())
                    .collect(Collectors.toList());
        }

        return GameEntity.builder()
                .id(entity.getId())
                .mode(entity.getMode())
                .status(entity.getStatus())
                .phase(entity.getPhase())
                .currentPlayerIndex(entity.getCurrentPlayerIndex())
                .turnNumber(entity.getTurnNumber())
                .banishmentCount(entity.getBanishmentCount())
                .hasRecruitedThisTurn(entity.isHasRecruitedThisTurn())
                .winnerPlayerIndex(entity.getWinnerPlayerIndex())
                .winnerVictoryType(entity.getWinnerVictoryType())
                .players(players)
                .build();
    }

    public static GameJpaEntity toEntity(GameEntity domain) {
        if (domain == null)
            return null;

        return GameJpaEntity.builder()
                .id(domain.getId())
                .mode(domain.getMode()) // <--- TRANSFERT CRUCIAL
                .status(domain.getStatus()) // <--- TRANSFERT CRUCIAL
                .phase(domain.getPhase()) // <--- TRANSFERT CRUCIAL
                .currentPlayerIndex(domain.getCurrentPlayerIndex())
                .turnNumber(domain.getTurnNumber())
                .banishmentCount(domain.getBanishmentCount())
                .hasRecruitedThisTurn(domain.isHasRecruitedThisTurn())
                .winnerPlayerIndex(domain.getWinnerPlayerIndex())
                .winnerVictoryType(domain.getWinnerVictoryType())
                .build();
    }
}