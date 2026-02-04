package esiea.hackathon.leaders.application.services;

import esiea.hackathon.leaders.domain.model.GameEntity;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import esiea.hackathon.leaders.domain.repository.GameRepository;
import esiea.hackathon.leaders.domain.repository.PieceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GameService {

    private final GameRepository gameRepository;
    private final PieceRepository pieceRepository;
    private final VictoryService victoryService;

    @Transactional
    public void endTurn(UUID gameId) {
        // 1. Récupérer le jeu
        GameEntity game = gameRepository.findById(gameId)
                .orElseThrow(() -> new IllegalArgumentException("Game not found"));

        // 2. Vérifier la victoire avant de passer le tour
        // Si la partie est finie, cette méthode lance une exception qui arrête tout
        victoryService.checkVictory(gameId);

        // 3. Changer de joueur
        // On alterne entre 0 et 1
        short nextPlayer = (short) ((game.getCurrentPlayerIndex() + 1) % 2);
        game.setCurrentPlayerIndex(nextPlayer);

        // 4. Gestion du numéro de tour
        // On incrémente le compteur à chaque fin de tour d'un joueur.
        // Cela permet au Front de savoir "C'est le tour global numéro X"
        game.setTurnNumber(game.getTurnNumber() + 1);

        // Mise à jour du timestamp
        game.setUpdatedAt(LocalDateTime.now());

        // 5. Réinitialiser les actions des pièces
        // On permet à toutes les pièces de rejouer au prochain tour
        List<PieceEntity> allPieces = pieceRepository.findByGameId(gameId);
        for (PieceEntity p : allPieces) {
            // Optimisation : on ne save que si nécessaire
            if (p.getHasActedThisTurn()) {
                p.setHasActedThisTurn(false);
                pieceRepository.save(p);
            }
        }

        // 6. Sauvegarde de l'état du jeu
        gameRepository.save(game);
    }
}