package esiea.hackathon.leaders.application.services;

import esiea.hackathon.leaders.application.dto.response.CardDto;
import esiea.hackathon.leaders.application.dto.response.GameStateDto;
import esiea.hackathon.leaders.application.dto.response.PieceDto;
import esiea.hackathon.leaders.application.dto.response.PlayerDto;
import esiea.hackathon.leaders.domain.model.GameEntity;
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
                                                        UUID userId = p.getUserId();
                                                        System.out.println("DEBUG: Resolving player with userId: "
                                                                        + userId + " (playerIndex: "
                                                                        + p.getPlayerIndex() + ")");
                                                        String username = "Guest "
                                                                        + (userId != null
                                                                                        ? userId.toString().substring(0,
                                                                                                        4)
                                                                                        : "Unknown");
                                                        if (esiea.hackathon.leaders.application.services.AiService.AI_PLAYER_ID
                                                                        .equals(userId)) {
                                                                username = "IA";
                                                        }
                                                        Integer elo = null;
                                                        if (userId != null) {
                                                                var user = userCredentialsRepository.findById(userId);
                                                                if (user.isPresent()) {
                                                                        username = user.get().getUsername();
                                                                        elo = user.get().getElo();
                                                                        System.out.println(
                                                                                        "DEBUG: Found authenticated user: "
                                                                                                        + username
                                                                                                        + " (ELO: "
                                                                                                        + elo + ")");
                                                                } else {
                                                                        System.out.println(
                                                                                        "DEBUG: No UserCredentials found for UUID: "
                                                                                                        + userId);
                                                                }
                                                        } else {
                                                                System.out.println(
                                                                                "DEBUG: Player userId is NULL for index: "
                                                                                                + p.getPlayerIndex());
                                                        }
                                                        Integer playerEloChange = (p.getPlayerIndex() == 0)
                                                                        ? game.getEloChangeP0()
                                                                        : game.getEloChangeP1();

                                                        return new PlayerDto(userId, username, elo, playerEloChange,
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
                                game.getEloChangeP0(),
                                game.getEloChangeP1(),
                                pieces,
                                river,
                                players);
        }
}