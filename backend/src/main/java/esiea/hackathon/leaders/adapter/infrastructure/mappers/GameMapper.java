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
                .recruitmentCount(entity.getRecruitmentCount())
                .winnerPlayerIndex(entity.getWinnerPlayerIndex())
                .winnerVictoryType(entity.getWinnerVictoryType())
                .players(players)
                .remainingTimeP0(entity.getRemainingTimeP0())
                .remainingTimeP1(entity.getRemainingTimeP1())
                .lastTimerUpdate(entity.getLastTimerUpdate())
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
                .recruitmentCount(domain.getRecruitmentCount())
                .winnerPlayerIndex(domain.getWinnerPlayerIndex())
                .winnerVictoryType(domain.getWinnerVictoryType())
                .remainingTimeP0(domain.getRemainingTimeP0())
                .remainingTimeP1(domain.getRemainingTimeP1())
                .lastTimerUpdate(domain.getLastTimerUpdate())
                .build();
    }
}