package esiea.hackathon.leaders.application.services;

import esiea.hackathon.leaders.domain.model.GameEntity;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import esiea.hackathon.leaders.domain.model.VictoryCheckResult;
import esiea.hackathon.leaders.domain.model.enums.GameStatus;
import esiea.hackathon.leaders.domain.repository.GameRepository;
import esiea.hackathon.leaders.domain.repository.PieceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GameService {

    private final GameRepository gameRepository;
    private final PieceRepository pieceRepository;
    private final VictoryService victoryService;

    @Transactional
    public GameEntity endTurn(UUID gameId) {
        System.out.println("DEBUG: Ending turn for game " + gameId);
        // 1. Récupérer le jeu
        GameEntity game = gameRepository.findById(gameId)
                .orElseThrow(() -> new IllegalArgumentException("Game not found"));

        // 2. Vérification de la victoire via le Value Object
        VictoryCheckResult victoryResult = victoryService.checkVictory(gameId);

        if (victoryResult.isGameOver()) {
            // --- CAS DE VICTOIRE (Fin de partie) ---
            game.setStatus(GameStatus.FINISHED);
            game.setWinnerPlayerIndex(victoryResult.winnerPlayerIndex());

            // Note : J'utilise le nom exact de ton entité (winnerVictoryType)
            game.setWinnerVictoryType(victoryResult.victoryType());

            // On ne change pas le joueur, on ne reset pas les actions. Le jeu est figé.

        } else {
            // --- CAS NORMAL (Le jeu continue) ---

            // A. Changer de joueur (Alternance 0 / 1)
            short nextPlayer = (short) ((game.getCurrentPlayerIndex() + 1) % 2);
            System.out.println("DEBUG: Switching player from " + game.getCurrentPlayerIndex() + " to " + nextPlayer);
            game.setCurrentPlayerIndex(nextPlayer);

            // B. Incrémenter le tour
            game.setTurnNumber(game.getTurnNumber() + 1);

            // C. Réinitialiser les actions des pièces pour le prochain tour
            resetPiecesActions(gameId);
        }

        // 3. Mise à jour timestamp et sauvegarde
        game.setUpdatedAt(LocalDateTime.now());
        return gameRepository.save(game);
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
}