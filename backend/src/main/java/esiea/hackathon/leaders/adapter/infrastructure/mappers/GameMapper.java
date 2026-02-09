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
                                .pieces(entity.getPieces() != null ? entity.getPieces().stream()
                                                .map(PieceMapper::toDomain)
                                                .collect(Collectors.toList()) : null)
                                .cards(entity.getCards() != null ? entity.getCards().stream()
                                                .map(RecruitmentCardMapper::toDomain)
                                                .collect(Collectors.toList()) : null)
                                .remainingTimeP0(entity.getRemainingTimeP0())
                                .remainingTimeP1(entity.getRemainingTimeP1())
                                .eloChangeP0(entity.getEloChangeP0())
                                .eloChangeP1(entity.getEloChangeP1())
                                .scenarioId(entity.getScenarioId())
                                .lastTimerUpdate(entity.getLastTimerUpdate())
                                .build();
        }

        public static GameJpaEntity toEntity(GameEntity domain) {
                if (domain == null)
                        return null;

                GameJpaEntity entity = GameJpaEntity.builder()
                                .id(domain.getId())
                                .mode(domain.getMode())
                                .status(domain.getStatus())
                                .phase(domain.getPhase())
                                .currentPlayerIndex(domain.getCurrentPlayerIndex())
                                .turnNumber(domain.getTurnNumber())
                                .banishmentCount(domain.getBanishmentCount())
                                .recruitmentCount(domain.getRecruitmentCount())
                                .winnerPlayerIndex(domain.getWinnerPlayerIndex())
                                .winnerVictoryType(domain.getWinnerVictoryType())
                                .remainingTimeP0(domain.getRemainingTimeP0())
                                .remainingTimeP1(domain.getRemainingTimeP1())
                                .eloChangeP0(domain.getEloChangeP0())
                                .eloChangeP1(domain.getEloChangeP1())
                                .scenarioId(domain.getScenarioId())
                                .lastTimerUpdate(domain.getLastTimerUpdate())
                                .build();

                if (domain.getPlayers() != null) {
                        entity.setPlayers(domain.getPlayers().stream()
                                        .map(p -> esiea.hackathon.leaders.adapter.infrastructure.entity.GamePlayerJpaEntity
                                                        .builder()
                                                        .id(p.getId())
                                                        .userId(p.getUserId())
                                                        .playerIndex(p.getPlayerIndex())
                                                        .isFirstTurnCompleted(p.isFirstTurnCompleted())
                                                        .game(entity)
                                                        .build())
                                        .collect(Collectors.toList()));
                }

                return entity;
        }
}