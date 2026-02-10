package esiea.hackathon.leaders.application.services;

import esiea.hackathon.leaders.domain.model.GameEntity;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import esiea.hackathon.leaders.domain.model.VictoryCheckResult;
import esiea.hackathon.leaders.domain.model.enums.GameStatus;
import esiea.hackathon.leaders.domain.repository.GameRepository;
import esiea.hackathon.leaders.domain.repository.PieceRepository;
import esiea.hackathon.leaders.domain.SessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import esiea.hackathon.leaders.application.services.EloService.EloResult;

@Service
@RequiredArgsConstructor
public class GameService {

    private final GameRepository gameRepository;
    private final PieceRepository pieceRepository;
    private final VictoryService victoryService;
    private final SessionRepository sessionRepository;
    private final EloService eloService;

    @Transactional
    public void finishGame(UUID gameId, Integer winnerIndex,
            esiea.hackathon.leaders.domain.model.enums.VictoryType victoryType) {
        GameEntity game = gameRepository.findById(gameId)
                .orElseThrow(() -> new IllegalArgumentException("Game not found"));

        if (game.getStatus() == GameStatus.FINISHED) {
            return;
        }

        System.out.println("DEBUG: Finishing game " + gameId + " with winner " + winnerIndex);
        game.setStatus(GameStatus.FINISHED);
        game.setWinnerPlayerIndex(winnerIndex);
        game.setWinnerVictoryType(victoryType);
        game.setUpdatedAt(LocalDateTime.now());

        // ELO Update
        if (winnerIndex != null && game.getPlayers() != null && game.getPlayers().size() >= 2) {
            UUID winnerUserId = game.getPlayers().stream()
                    .filter(p -> p.getPlayerIndex() == winnerIndex)
                    .map(esiea.hackathon.leaders.domain.model.GamePlayerEntity::getUserId)
                    .findFirst().orElse(null);

            int loserIndex = (winnerIndex == 0) ? 1 : 0;
            UUID loserUserId = game.getPlayers().stream()
                    .filter(p -> p.getPlayerIndex() == loserIndex)
                    .map(esiea.hackathon.leaders.domain.model.GamePlayerEntity::getUserId)
                    .findFirst().orElse(null);

            Optional<EloResult> eloResult = eloService.updateElo(winnerUserId, loserUserId);

            EloResult result = eloResult.orElseGet(() -> eloService.calculateEloDelta(1200, 1200));

            if (winnerIndex == 0) {
                game.setEloChangeP0(result.winnerDelta());
                game.setEloChangeP1(result.loserDelta());
            } else {
                game.setEloChangeP0(result.loserDelta());
                game.setEloChangeP1(result.winnerDelta());
            }
        }

        gameRepository.save(game);
        updateSessionStatusToFinished(gameId);
    }

    @org.springframework.context.annotation.Lazy
    @org.springframework.beans.factory.annotation.Autowired
    private AiService aiService;

    @Transactional
    public GameEntity endTurn(UUID gameId) {
        System.out.println("DEBUG: Ending turn for game " + gameId);
        // 1. Récupérer le jeu
        GameEntity game = gameRepository.findById(gameId)
                .orElseThrow(() -> new IllegalArgumentException("Game not found"));

        // 2. Vérification de la victoire via le Value Object
        VictoryCheckResult victoryResult = victoryService.checkVictory(gameId);

        if (victoryResult.isGameOver()) {
            finishGame(gameId, victoryResult.winnerPlayerIndex(), victoryResult.victoryType());
            return gameRepository.findById(gameId).get();
        } else {
            // --- CAS NORMAL (Le jeu continue) ---
            updateTimer(game);
            short nextPlayer = (short) ((game.getCurrentPlayerIndex() + 1) % 2);
            game.setCurrentPlayerIndex(nextPlayer);
            game.setTurnNumber(game.getTurnNumber() + 1);
            resetPiecesActions(gameId);
            game.setRecruitmentCount(0);

            // Trigger AI if it's AI turn
            boolean isVsAi = isVsAiGame(game);

            System.out.println("DEBUG: endTurn nextPlayer=" + nextPlayer + ", isVsAi=" + isVsAi);
            // AI Trigger moved to Controller to avoid Transactional race conditions
        }

        game.setUpdatedAt(LocalDateTime.now());
        return gameRepository.save(game);
    }

    private boolean isVsAiGame(GameEntity game) {
        return game.getPlayers().stream()
                .anyMatch(p -> p.getUserId().equals(AiService.AI_PLAYER_ID));
    }

    @Transactional
    public void surrender(UUID gameId, String playerId) {
        GameEntity game = gameRepository.findById(gameId)
                .orElseThrow(() -> new IllegalArgumentException("Game not found"));

        if (game.getStatus() == GameStatus.FINISHED) {
            return;
        }

        // Find surrendering player index
        Integer surrenderingIndex = game.getPlayers().stream()
                .filter(p -> p.getUserId().toString().equals(playerId))
                .map(esiea.hackathon.leaders.domain.model.GamePlayerEntity::getPlayerIndex)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Player not found in this game"));

        Integer winnerIndex = (surrenderingIndex == 0) ? 1 : 0;

        System.out.println("DEBUG: Surrender in game " + gameId + " by player " + surrenderingIndex + ". Winner is "
                + winnerIndex);

        finishGame(gameId, winnerIndex, esiea.hackathon.leaders.domain.model.enums.VictoryType.RESIGNATION);
    }

    private void updateSessionStatusToFinished(UUID gameId) {
        try {
            // GameID is the same as SessionID
            sessionRepository.findById(gameId.toString()).ifPresent(session -> {
                if (session.getStatus() == esiea.hackathon.leaders.domain.Session.SessionStatus.ACTIVE) {
                    session.finish();
                    System.out.println("DEBUG: Session " + gameId + " marked as FINISHED.");
                }
            });
        } catch (Exception e) {
            System.err.println("Error updating session status: " + e.getMessage());
        }
    }

    /**
     * Réinitialise le flag 'hasActedThisTurn' pour toutes les pièces ayant bougé.
     * Optimisé pour ne sauvegarder que les pièces modifiées.
     */
    private void resetPiecesActions(UUID gameId) {
        List<PieceEntity> allPieces = pieceRepository.findByGameId(gameId);

        List<PieceEntity> piecesToReset = allPieces.stream()
                .filter(PieceEntity::getHasActedThisTurn) // On filtre celles qui sont true
                .peek(p -> p.setHasActedThisTurn(false)) // On les passe à false
                .collect(Collectors.toList());

        if (!piecesToReset.isEmpty()) {
            pieceRepository.saveAll(piecesToReset);
        }
    }

    /**
     * Calcule le temps écoulé depuis la dernière mise à jour et le soustrait au
     * joueur actif.
     * Vérifie également si le temps est écoulé (Timeout).
     */
    /**
     * Vérifie si un joueur a perdu au temps.
     * Cette méthode est appelée à chaque polling (getGameState).
     */
    @Transactional
    public void checkTimeout(UUID gameId) {
        GameEntity game = gameRepository.findById(gameId).orElse(null);
        if (game != null && game.getStatus() == GameStatus.IN_PROGRESS) {
            updateTimer(game);
            if (game.getStatus() == GameStatus.FINISHED) {
                gameRepository.save(game);
                updateSessionStatusToFinished(game.getId());
            }
        }
    }

    /**
     * Calcule le temps écoulé depuis la dernière mise à jour et le soustrait au
     * joueur actif.
     * Vérifie également si le temps est écoulé (Timeout).
     */
    public void updateTimer(GameEntity game) {
        if (game.getStatus() != GameStatus.IN_PROGRESS) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        if (game.getLastTimerUpdate() != null) {
            long secondsElapsed = Duration.between(game.getLastTimerUpdate(), now).toSeconds();
            if (secondsElapsed > 0) {
                if (game.getCurrentPlayerIndex() == 0) {
                    game.setRemainingTimeP0((int) Math.max(0, game.getRemainingTimeP0() - secondsElapsed));
                } else {
                    game.setRemainingTimeP1((int) Math.max(0, game.getRemainingTimeP1() - secondsElapsed));
                }
                // Important : mettre à jour le timestamp pour ne pas décompter deux fois
                game.setLastTimerUpdate(now);
            }
        } else {
            // Si c'est la première fois, on initialise
            game.setLastTimerUpdate(now);
        }

        // Vérification Timeout
        int currentTime = (game.getCurrentPlayerIndex() == 0) ? game.getRemainingTimeP0() : game.getRemainingTimeP1();
        if (currentTime <= 0) {
            System.out.println("DEBUG: TIMEOUT detected for player " + game.getCurrentPlayerIndex());
            finishGame(game.getId(), (game.getCurrentPlayerIndex() == 0) ? 1 : 0,
                    esiea.hackathon.leaders.domain.model.enums.VictoryType.TIMEOUT);
        }
    }
}