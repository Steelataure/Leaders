package esiea.hackathon.leaders.application.dto.response;

import esiea.hackathon.leaders.domain.model.enums.GameStatus;
import esiea.hackathon.leaders.domain.model.enums.GamePhase;
import esiea.hackathon.leaders.domain.model.enums.VictoryType; // N'oublie pas l'import !
import java.util.List;
import java.util.UUID;

public record GameStateDto(
                UUID gameId,
                GameStatus status,
                GamePhase currentPhase,
                int currentPlayerIndex,
                int turnNumber,
                Integer winnerPlayerIndex,
                VictoryType winnerVictoryType,

                List<PieceDto> pieces,
                List<CardDto> river,
                List<PlayerDto> players) {
}