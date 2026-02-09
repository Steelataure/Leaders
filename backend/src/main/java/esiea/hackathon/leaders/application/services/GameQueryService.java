package esiea.hackathon.leaders.application.services;

import esiea.hackathon.leaders.application.dto.response.CardDto;
import esiea.hackathon.leaders.application.dto.response.GameStateDto;
import esiea.hackathon.leaders.application.dto.response.PieceDto;
import esiea.hackathon.leaders.application.dto.response.PlayerDto;
import esiea.hackathon.leaders.domain.model.GameEntity;
import esiea.hackathon.leaders.domain.model.enums.CardState;
import esiea.hackathon.leaders.domain.repository.GameRepository;
import esiea.hackathon.leaders.domain.repository.PieceRepository;
import esiea.hackathon.leaders.domain.repository.RecruitmentCardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Duration;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GameQueryService {

        private final GameRepository gameRepository;
        private final PieceRepository pieceRepository;
        private final RecruitmentCardRepository cardRepository;
        private final esiea.hackathon.leaders.domain.repository.UserCredentialsRepository userCredentialsRepository;

        @Transactional(readOnly = true)
        public GameStateDto getGameState(UUID gameId) {
                System.out.println("DEBUG: Fetching game state for ID: " + gameId);
                // 1. Jeu
                GameEntity game = gameRepository.findById(gameId)
                                .orElseThrow(() -> {
                                        System.out.println("ERROR: Game not found in DB for ID: " + gameId);
                                        return new esiea.hackathon.leaders.infrastructure.exception.GameNotFoundException(
                                                        "Game not found with ID: " + gameId);
                                });

                // 2. Pièces
                List<PieceDto> pieces = pieceRepository.findByGameId(gameId).stream()
                                .map(p -> new PieceDto(
                                                p.getId(),
                                                p.getCharacterId(),
                                                p.getOwnerIndex().intValue(),
                                                p.getQ(),
                                                p.getR(),
                                                p.getHasActedThisTurn()))
                                .toList();

                // 3. Rivière
                List<CardDto> river = cardRepository.findAllByGameId(gameId).stream()
                                .filter(c -> c.getState() == esiea.hackathon.leaders.domain.model.enums.CardState.VISIBLE)
                                .map(c -> new CardDto(
                                                c.getId(),
                                                c.getCharacter().getId(),
                                                c.getState(),
                                                c.getVisibleSlot()))
                                .toList();

                // 4. Joueurs
                List<PlayerDto> players = game.getPlayers() != null
                                ? game.getPlayers().stream()
                                                .map(p -> {
                                                        String username = "Guest "
                                                                        + p.getUserId().toString().substring(0, 4);
                                                        var user = userCredentialsRepository.findById(p.getUserId());
                                                        if (user.isPresent()) {
                                                                username = user.get().getUsername();
                                                        }
                                                        return new PlayerDto(p.getUserId(), username,
                                                                        p.getPlayerIndex());
                                                })
                                                .toList()
                                : List.of();

                // 5. Calcul du temps REEL (non persisité en DB ici, mais calculé pour le DTO)
                int timeP0 = game.getRemainingTimeP0();
                int timeP1 = game.getRemainingTimeP1();

                if (game.getStatus() == esiea.hackathon.leaders.domain.model.enums.GameStatus.IN_PROGRESS
                                && game.getLastTimerUpdate() != null) {
                        long secondsElapsed = Duration.between(game.getLastTimerUpdate(), LocalDateTime.now())
                                        .toSeconds();
                        if (secondsElapsed > 0) {
                                if (game.getCurrentPlayerIndex() == 0) {
                                        timeP0 = (int) Math.max(0, timeP0 - secondsElapsed);
                                } else {
                                        timeP1 = (int) Math.max(0, timeP1 - secondsElapsed);
                                }
                        }
                }

                // 6. DTO final
                return new GameStateDto(
                                game.getId(),
                                game.getStatus(),
                                game.getPhase(),
                                game.getCurrentPlayerIndex(),
                                game.getTurnNumber(),
                                // LOGIQUE DTO: hasRecruitedThisTurn = true SI on a atteint la limite
                                // Limite = 2 pour J2 au Tour 2, sinon 1
                                game.getRecruitmentCount() >= ((game.getCurrentPlayerIndex() == 1
                                                && game.getTurnNumber() <= 2) ? 2 : 1),
                                game.getWinnerPlayerIndex(),
                                game.getWinnerVictoryType(),
                                timeP0,
                                timeP1,
                                game.getLastTimerUpdate(),
                                pieces,
                                river,
                                players);
        }
}