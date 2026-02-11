package esiea.hackathon.leaders.adapter.infrastructure.mappers;

import esiea.hackathon.leaders.adapter.infrastructure.entity.GameJpaEntity;
import esiea.hackathon.leaders.adapter.infrastructure.entity.GamePlayerJpaEntity;
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
                                .aiDifficulty(entity.getAiDifficulty())
                                .actions(entity.getActions() != null ? entity.getActions().stream()
                                                .map(GameMapper::toActionDomain)
                                                .collect(Collectors.toList()) : null)
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
                                .aiDifficulty(domain.getAiDifficulty())
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

                if (domain.getActions() != null) {
                        entity.setActions(domain.getActions().stream()
                                        .map(a -> toActionJpa(a, entity))
                                        .collect(Collectors.toList()));
                }

                return entity;
        }

        public static GamePlayerEntity toPlayerDomain(GamePlayerJpaEntity entity) {
                if (entity == null)
                        return null;

                return GamePlayerEntity.builder()
                                .id(entity.getId())
                                .userId(entity.getUserId())
                                .playerIndex(entity.getPlayerIndex())
                                .isFirstTurnCompleted(entity.isFirstTurnCompleted())
                                // Note: We don't map the parent Game here to avoid infinite recursion
                                // or we could map it with a shallow proxy if needed.
                                // For now, we leave it null or handled by the caller/GameEntity mapping.
                                .build();
        }

        public static GamePlayerJpaEntity toPlayerJpa(GamePlayerEntity domain) {
                if (domain == null)
                        return null;

                GameJpaEntity gameRef = null;
                if (domain.getGame() != null) {
                        // Create a shallow reference to the game to satify foreign key if needed
                        // without triggering full recursion
                        gameRef = GameJpaEntity.builder().id(domain.getGame().getId()).build();
                }

                return GamePlayerJpaEntity.builder()
                                .id(domain.getId())
                                .userId(domain.getUserId())
                                .playerIndex(domain.getPlayerIndex())
                                .isFirstTurnCompleted(domain.isFirstTurnCompleted())
                                .game(gameRef)
                                .build();
        }

        public static esiea.hackathon.leaders.domain.model.GameActionEntity toActionDomain(
                        esiea.hackathon.leaders.adapter.infrastructure.entity.GameActionJpaEntity entity) {
                if (entity == null)
                        return null;
                return esiea.hackathon.leaders.domain.model.GameActionEntity.builder()
                                .id(entity.getId())
                                .turnNumber(entity.getTurnNumber())
                                .playerIndex(entity.getPlayerIndex())
                                .actionOrder(entity.getActionOrder())
                                .actionType(entity.getActionType())
                                .pieceId(entity.getPieceId())
                                .fromQ(entity.getFromQ())
                                .fromR(entity.getFromR())
                                .toQ(entity.getToQ())
                                .toR(entity.getToR())
                                .targetPieceId(entity.getTargetPieceId())
                                .createdAt(entity.getCreatedAt())
                                .ability(entity.getAbilityId() != null
                                                ? esiea.hackathon.leaders.domain.model.AbilityEntity.builder()
                                                                .id(entity.getAbilityId()).build()
                                                : null)
                                .character(entity.getCharacterId() != null
                                                ? esiea.hackathon.leaders.domain.model.RefCharacterEntity.builder()
                                                                .id(entity.getCharacterId()).build()
                                                : null)
                                .build();
        }

        public static esiea.hackathon.leaders.adapter.infrastructure.entity.GameActionJpaEntity toActionJpa(
                        esiea.hackathon.leaders.domain.model.GameActionEntity domain, GameJpaEntity gameEntity) {
                if (domain == null)
                        return null;
                return esiea.hackathon.leaders.adapter.infrastructure.entity.GameActionJpaEntity.builder()
                                .id(domain.getId())
                                .game(gameEntity)
                                .turnNumber(domain.getTurnNumber())
                                .playerIndex(domain.getPlayerIndex())
                                .actionOrder(domain.getActionOrder())
                                .actionType(domain.getActionType())
                                .pieceId(domain.getPieceId())
                                .fromQ(domain.getFromQ())
                                .fromR(domain.getFromR())
                                .toQ(domain.getToQ())
                                .toR(domain.getToR())
                                .targetPieceId(domain.getTargetPieceId())
                                .abilityId(domain.getAbility() != null ? domain.getAbility().getId() : null)
                                .characterId(domain.getCharacter() != null ? domain.getCharacter().getId() : null)
                                .build();
        }
}