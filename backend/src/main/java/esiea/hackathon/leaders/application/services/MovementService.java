package esiea.hackathon.leaders.application.services;

import esiea.hackathon.leaders.application.strategies.MoveAbilityStrategy;
import esiea.hackathon.leaders.application.strategies.action.NemesisBehavior;
import esiea.hackathon.leaders.application.strategies.movement.MoveStrategyFactory;
import esiea.hackathon.leaders.domain.model.GameEntity;
import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import esiea.hackathon.leaders.domain.model.RefCharacterEntity;
import esiea.hackathon.leaders.domain.repository.GameRepository;
import esiea.hackathon.leaders.domain.repository.PieceRepository;
import esiea.hackathon.leaders.domain.repository.RefCharacterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private final GameRepository gameRepository; // 1. Dépendance nécessaire

    @Transactional
    public PieceEntity movePiece(UUID pieceId, short toQ, short toR, UUID playerId) {
        // Validation basique des coordonnées
        HexCoord target = new HexCoord(toQ, toR);
        if (!target.isValid()) {
            throw new IllegalArgumentException("Invalid hex coordinates: (" + toQ + "," + toR + ")");
        }

        // Chargement de la pièce
        PieceEntity pieceEntity = pieceRepository.findById(pieceId)
                .orElseThrow(() -> new IllegalArgumentException("Piece not found: " + pieceId));
        System.out.println(
                "DEBUG: Moving piece " + pieceEntity.getCharacterId() + " owned by " + pieceEntity.getOwnerIndex());

        // 2. Chargement du Jeu
        GameEntity game = gameRepository.findById(pieceEntity.getGameId())
                .orElseThrow(() -> new IllegalArgumentException("Game not found"));

        // 3. 🛑 SÉCURITÉ : Vérification du tour et de l'identité
        // On compare l'index du propriétaire de la pièce avec l'index du joueur courant
        if (pieceEntity.getOwnerIndex().intValue() != game.getCurrentPlayerIndex()) {
            System.err.println("DEBUG: Not your turn! PieceOwner=" + pieceEntity.getOwnerIndex() + ", CurrentPlayer="
                    + game.getCurrentPlayerIndex());
            throw new IllegalStateException("Action refusée : Ce n'est pas votre tour !");
        }

        // Vérification de l'identité du joueur (empêche de jouer pour l'adversaire même
        // si c'est son tour)
        // On récupère le joueur correspondant à l'index courant
        var currentPlayer = game.getPlayers().stream()
                .filter(p -> p.getPlayerIndex() == game.getCurrentPlayerIndex())
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Current player not found in game"));

        if (playerId != null && !playerId.equals(currentPlayer.getUserId())) {
            System.err.println(
                    "SECURITY ALERT: Player " + playerId + " tried to move piece of " + currentPlayer.getUserId());
            throw new IllegalStateException("Action refusée : Vous n'êtes pas le joueur actif !");
        }

        // 4. Vérification si la pièce a déjà agi
        if (pieceEntity.getHasActedThisTurn()) {
            throw new IllegalArgumentException("This piece has already acted this turn.");
        }

        // 5. Calcul des mouvements légaux
        List<HexCoord> legalMoves = getValidMovesForPiece(pieceId);

        if (!legalMoves.contains(target)) {
            System.err.println("DEBUG: Illegal move. Target invalid. Legal moves: " + legalMoves);
            throw new IllegalArgumentException(
                    "Illegal move from (" + pieceEntity.getQ() + "," + pieceEntity.getR() + ") to (" + toQ + "," + toR
                            + ")");
        }

        // 6. Application du déplacement
        pieceEntity.setQ(toQ);
        pieceEntity.setR(toR);
        pieceEntity.setHasActedThisTurn(true);

        PieceEntity savedPiece = pieceRepository.save(pieceEntity);

        // 7. Trigger Némésis (si un Leader a bougé)
        triggerNemesisIfLeaderMoved(savedPiece, savedPiece.getGameId());

        return savedPiece;
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
        if (!"LEADER".equals(movedPiece.getCharacterId()))
            return;

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
        adjacent.add(new HexCoord((short) (q + 1), r));
        adjacent.add(new HexCoord((short) (q - 1), r));
        adjacent.add(new HexCoord(q, (short) (r + 1)));
        adjacent.add(new HexCoord(q, (short) (r - 1)));
        adjacent.add(new HexCoord((short) (q + 1), (short) (r - 1)));
        adjacent.add(new HexCoord((short) (q - 1), (short) (r + 1)));

        // Filtre pour garder ceux qui sont dans le plateau (Rayon 3)
        return adjacent.stream()
                .filter(HexCoord::isValid)
                .toList();
    }

    private boolean isCellEmpty(short q, short r, List<PieceEntity> allPieces) {
        return allPieces.stream().noneMatch(p -> p.getQ() == q && p.getR() == r);
    }
}