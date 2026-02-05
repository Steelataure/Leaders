package esiea.hackathon.leaders.application.services;

import esiea.hackathon.leaders.domain.model.GameEntity;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import esiea.hackathon.leaders.domain.model.VictoryCheckResult;
import esiea.hackathon.leaders.domain.model.enums.GameStatus;
import esiea.hackathon.leaders.domain.repository.GameRepository;
import esiea.hackathon.leaders.domain.repository.PieceRepository;
import lombok.RequiredArgsConstructor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GameService {

    private static final Logger LOGGER = LogManager.getLogger(GameService.class);

    private final GameRepository gameRepository;
    private final PieceRepository pieceRepository;
    private final VictoryService victoryService;

    @Transactional
    public GameEntity endTurn(UUID gameId) {
        LOGGER.info("Fin du tour demandée pour la partie : {}", gameId);

        // 1. Récupérer le jeu
        GameEntity game = gameRepository.findById(gameId)
                .orElseThrow(() -> {
                    LOGGER.error("Échec de la fin du tour : Partie introuvable pour l'ID {}", gameId);
                    return new IllegalArgumentException("Game not found");
                });

        // 2. Vérification de la victoire via le Value Object
        LOGGER.debug("Vérification des conditions de victoire pour la partie {}", gameId);
        VictoryCheckResult victoryResult = victoryService.checkVictory(gameId);

        if (victoryResult.isGameOver()) {
            LOGGER.info("Fin de partie détectée pour {}. Vainqueur : Joueur {}, Type de victoire : {}", 
                    gameId, victoryResult.winnerPlayerIndex(), victoryResult.victoryType());
            
            game.setStatus(GameStatus.FINISHED);
            game.setWinnerPlayerIndex(victoryResult.winnerPlayerIndex());
            // Note : J'utilise le nom exact de ton entité (winnerVictoryType)
            game.setWinnerVictoryType(victoryResult.victoryType());
            // On ne change pas le joueur, on ne reset pas les actions. Le jeu est figé.

        } else {
            // --- CAS NORMAL (Le jeu continue) ---

            short oldPlayer = (short) game.getCurrentPlayerIndex();
            // A. Changer de joueur (Alternance 0 / 1)
            short nextPlayer = (short) ((oldPlayer + 1) % 2);
            game.setCurrentPlayerIndex(nextPlayer);

            // B. Incrémenter le tour
            game.setTurnNumber(game.getTurnNumber() + 1);

            LOGGER.info("Le jeu continue. Passage du joueur {} au joueur {}. Nouveau tour : {}", 
                    oldPlayer, nextPlayer, game.getTurnNumber());

            // C. Réinitialiser les actions des pièces pour le prochain tour
            resetPiecesActions(gameId);
        }

        // 3. Mise à jour timestamp et sauvegarde
        game.setUpdatedAt(LocalDateTime.now());
        LOGGER.debug("Sauvegarde de l'état de la partie {}", gameId);
        return gameRepository.save(game);
    }

    /**
     * Réinitialise le flag 'hasActedThisTurn' pour toutes les pièces ayant bougé.
     * Optimisé pour ne sauvegarder que les pièces modifiées.
     */
    private void resetPiecesActions(UUID gameId) {
        LOGGER.debug("Réinitialisation des actions des pièces pour la partie {}", gameId);
        
        List<PieceEntity> allPieces = pieceRepository.findByGameId(gameId);

        List<PieceEntity> piecesToReset = allPieces.stream()
                .filter(PieceEntity::getHasActedThisTurn) // On filtre celles qui sont true
                .peek(p -> p.setHasActedThisTurn(false))  // On les passe à false
                .collect(Collectors.toList());

        if (!piecesToReset.isEmpty()) {
            LOGGER.info("Réinitialisation terminée : {} pièces mises à jour.", piecesToReset.size());
            pieceRepository.saveAll(piecesToReset);
        } else {
            LOGGER.debug("Aucune pièce n'avait agi ce tour-ci.");
        }
    }
}