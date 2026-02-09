package esiea.hackathon.leaders.application.dto.response;

import esiea.hackathon.leaders.domain.model.enums.GameStatus;
import esiea.hackathon.leaders.domain.model.enums.GamePhase;
import esiea.hackathon.leaders.domain.model.enums.VictoryType;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record GameStateDto(
                UUID gameId,
                GameStatus status,
                GamePhase currentPhase,
                int currentPlayerIndex,
                int turnNumber,
                boolean hasRecruitedThisTurn,
                Integer winnerPlayerIndex,
                VictoryType winnerVictoryType,
                int remainingTimeP0,
                int remainingTimeP1,
                LocalDateTime lastTimerUpdate,

                List<PieceDto> pieces,
                List<CardDto> river,
                List<PlayerDto> players) {
}