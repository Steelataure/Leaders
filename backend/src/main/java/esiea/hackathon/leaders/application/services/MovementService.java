package esiea.hackathon.leaders.application.services;

import esiea.hackathon.leaders.application.strategies.MoveAbilityStrategy;
import esiea.hackathon.leaders.application.strategies.action.NemesisBehavior;
import esiea.hackathon.leaders.application.strategies.movement.MoveStrategyFactory;
import esiea.hackathon.leaders.domain.model.GameEntity;
import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import esiea.hackathon.leaders.domain.model.RefCharacterEntity;
import esiea.hackathon.leaders.domain.model.VictoryCheckResult;
import esiea.hackathon.leaders.domain.model.enums.GameStatus;
import esiea.hackathon.leaders.domain.repository.GameRepository;
import esiea.hackathon.leaders.domain.repository.PieceRepository;
import esiea.hackathon.leaders.domain.repository.RefCharacterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MovementService {

    private final PieceRepository pieceRepository;
    private final RefCharacterRepository characterRepository;
    private final MoveStrategyFactory strategyFactory;
    private final NemesisBehavior nemesisBehavior;
    private final GameRepository gameRepository;
    private final VictoryService victoryService; // 🆕 Injection du VictoryService

    @Transactional
    public PieceEntity movePiece(UUID pieceId, short toQ, short toR) {
        // Validation basique des coordonnées
        HexCoord target = new HexCoord(toQ, toR);
        if (!target.isValid()) {
            throw new IllegalArgumentException("Invalid hex coordinates: (" + toQ + "," + toR + ")");
        }

        // Chargement de la pièce
        PieceEntity pieceEntity = pieceRepository.findById(pieceId)
                .orElseThrow(() -> new IllegalArgumentException("Piece not found: " + pieceId));

        // Chargement du Jeu
        GameEntity game = gameRepository.findById(pieceEntity.getGameId())
                .orElseThrow(() -> new IllegalArgumentException("Game not found"));

        // 🛑 SÉCURITÉ : Vérification du tour
        if (pieceEntity.getOwnerIndex().intValue() != game.getCurrentPlayerIndex()) {
            throw new IllegalStateException("Action refusée : Ce n'est pas votre tour !");
        }

        // Vérification si la pièce a déjà agi
        if (pieceEntity.getHasActedThisTurn()) {
            throw new IllegalArgumentException("This piece has already acted this turn.");
        }

        // Calcul des mouvements légaux
        List<HexCoord> legalMoves = getValidMovesForPiece(pieceId);

        if (!legalMoves.contains(target)) {
            throw new IllegalArgumentException(
                    "Illegal move from (" + pieceEntity.getQ() + "," + pieceEntity.getR() + ") to (" + toQ + "," + toR + ")"
            );
        }

        // Application du déplacement
        pieceEntity.setQ(toQ);
        pieceEntity.setR(toR);
        pieceEntity.setHasActedThisTurn(true);

        PieceEntity savedPiece = pieceRepository.save(pieceEntity);

        // Trigger Némésis (si un Leader a bougé)
        triggerNemesisIfLeaderMoved(savedPiece, savedPiece.getGameId());

        // 🆕 SCÉNARIO 7: Vérification de victoire IMMÉDIATE après chaque mouvement
        // Cela permet à l'Assassin (seul) ou à l'Archère (à distance 2) de déclencher la victoire
        checkAndApplyVictory(game);

        return savedPiece;
    }

    /**
     * 🆕 Vérifie si une condition de victoire est remplie et termine la partie si nécessaire.
     * Appelé après chaque mouvement et chaque action.
     */
    private void checkAndApplyVictory(GameEntity game) {
        VictoryCheckResult result = victoryService.checkVictory(game.getId());
        
        if (result.isGameOver()) {
            game.setStatus(GameStatus.FINISHED);
            game.setWinnerPlayerIndex(result.winnerPlayerIndex());
            game.setWinnerVictoryType(result.victoryType());
            game.setUpdatedAt(LocalDateTime.now());
            gameRepository.save(game);
        }
    }

    public List<HexCoord> getValidMovesForPiece(UUID pieceId) {
        PieceEntity piece = pieceRepository.findById(pieceId)
                .orElseThrow(() -> new IllegalArgumentException("Piece not found"));

        RefCharacterEntity character = characterRepository.findById(piece.getCharacterId())
                .orElseThrow(() -> new IllegalStateException("Character definition not found"));

        List<PieceEntity> allPieces = pieceRepository.findByGameId(piece.getGameId());
        List<HexCoord> validMoves = new ArrayList<>();

        // Règle : La Némésis ne bouge pas normalement
        if (!"NEMESIS".equals(character.getId())) {
            validMoves.addAll(getStandardMoves(piece, allPieces));
        }

        // Règle : Bonus du Vizir pour le Leader
        if ("LEADER".equals(character.getId())) {
            MoveAbilityStrategy leaderStrat = strategyFactory.getStrategy("VIZIER_BOOST");
            if (leaderStrat != null) {
                validMoves.addAll(leaderStrat.getExtraMoves(piece, allPieces));
            }
        }

        // Règle : Compétences de mouvement spéciales (Acrobate, etc.)
        if (character.getAbilities() != null) {
            for (var ability : character.getAbilities()) {
                MoveAbilityStrategy strategy = strategyFactory.getStrategy(ability.getId());
                if (strategy != null) {
                    validMoves.addAll(strategy.getExtraMoves(piece, allPieces));
                }
            }
        }

        return validMoves;
    }

    // --- Helpers ---

    private void triggerNemesisIfLeaderMoved(PieceEntity movedPiece, UUID gameId) {
        if (!"LEADER".equals(movedPiece.getCharacterId())) return;

        List<PieceEntity> allPieces = pieceRepository.findByGameId(gameId);

        // La Némésis réagit au mouvement du Leader ennemi
        allPieces.stream()
                .filter(p -> "NEMESIS".equals(p.getCharacterId()))
                .filter(p -> !p.getOwnerIndex().equals(movedPiece.getOwnerIndex())) // Némésis Ennemie
                .findFirst()
                .ifPresent(nemesis -> {
                    nemesisBehavior.react(nemesis, movedPiece, allPieces);
                    pieceRepository.save(nemesis);
                });
    }

    private List<HexCoord> getStandardMoves(PieceEntity piece, List<PieceEntity> allPieces) {
        return getAdjacentCells(piece.getQ(), piece.getR()).stream()
                .filter(coord -> isCellEmpty(coord.q(), coord.r(), allPieces))
                .toList();
    }

    public List<HexCoord> getAdjacentCells(short q, short r) {
        List<HexCoord> adjacent = new ArrayList<>();
        adjacent.add(new HexCoord((short)(q + 1), r));
        adjacent.add(new HexCoord((short)(q - 1), r));
        adjacent.add(new HexCoord(q, (short)(r + 1)));
        adjacent.add(new HexCoord(q, (short)(r - 1)));
        adjacent.add(new HexCoord((short)(q + 1), (short)(r - 1)));
        adjacent.add(new HexCoord((short)(q - 1), (short)(r + 1)));

        // Filtre pour garder ceux qui sont dans le plateau (Rayon 3)
        return adjacent.stream()
                .filter(HexCoord::isValid)
                .toList();
    }

    private boolean isCellEmpty(short q, short r, List<PieceEntity> allPieces) {
        return allPieces.stream().noneMatch(p -> p.getQ() == q && p.getR() == r);
    }
}