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
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MovementService {

    private static final Logger LOGGER = LogManager.getLogger(MovementService.class);

    private final PieceRepository pieceRepository;
    private final RefCharacterRepository characterRepository;
    private final MoveStrategyFactory strategyFactory;
    private final NemesisBehavior nemesisBehavior;
    private final GameRepository gameRepository; // 1. Dépendance nécessaire

    @Transactional
    public PieceEntity movePiece(UUID pieceId, short toQ, short toR) {
        LOGGER.info("Tentative de déplacement de la pièce {} vers ({}, {})", pieceId, toQ, toR);

        // Validation basique des coordonnées
        HexCoord target = new HexCoord(toQ, toR);
        if (!target.isValid()) {
            LOGGER.error("Coordonnées hexadécimales invalides : ({}, {})", toQ, toR);
            throw new IllegalArgumentException("Invalid hex coordinates: (" + toQ + "," + toR + ")");
        }

        // Chargement de la pièce
        PieceEntity pieceEntity = pieceRepository.findById(pieceId)
                .orElseThrow(() -> {
                    LOGGER.error("Pièce introuvable avec l'ID : {}", pieceId);
                    return new IllegalArgumentException("Piece not found: " + pieceId);
                });

        // 2. Chargement du Jeu
        GameEntity game = gameRepository.findById(pieceEntity.getGameId())
                .orElseThrow(() -> {
                    LOGGER.error("Jeu introuvable pour la pièce : {}", pieceId);
                    return new IllegalArgumentException("Game not found");
                });

        // 3. 🛑 SÉCURITÉ : Vérification du tour
        // On compare l'index du propriétaire de la pièce avec l'index du joueur courant
        if (pieceEntity.getOwnerIndex().intValue() != game.getCurrentPlayerIndex()) {
            LOGGER.warn("Action refusée : Le joueur {} tente de jouer alors que c'est le tour du joueur {}", 
                        pieceEntity.getOwnerIndex(), game.getCurrentPlayerIndex());
            throw new IllegalStateException("Action refusée : Ce n'est pas votre tour !");
        }

        // 4. Vérification si la pièce a déjà agi
        if (pieceEntity.getHasActedThisTurn()) {
            LOGGER.warn("La pièce {} a déjà effectué une action ce tour-ci", pieceId);
            throw new IllegalArgumentException("This piece has already acted this turn.");
        }

        // 5. Calcul des mouvements légaux
        List<HexCoord> legalMoves = getValidMovesForPiece(pieceId);

        if (!legalMoves.contains(target)) {
            LOGGER.error("Mouvement illégal de ({}, {}) vers ({}, {}) pour la pièce {}", 
                         pieceEntity.getQ(), pieceEntity.getR(), toQ, toR, pieceId);
            throw new IllegalArgumentException(
                    "Illegal move from (" + pieceEntity.getQ() + "," + pieceEntity.getR() + ") to (" + toQ + "," + toR + ")"
            );
        }

        // 6. Application du déplacement
        pieceEntity.setQ(toQ);
        pieceEntity.setR(toR);
        pieceEntity.setHasActedThisTurn(true);

        PieceEntity savedPiece = pieceRepository.save(pieceEntity);
        LOGGER.info("Déplacement réussi pour la pièce {}", pieceId);

        // 7. Trigger Némésis (si un Leader a bougé)
        triggerNemesisIfLeaderMoved(savedPiece, savedPiece.getGameId());

        return savedPiece;
    }

    public List<HexCoord> getValidMovesForPiece(UUID pieceId) {
        LOGGER.debug("Calcul des mouvements valides pour la pièce {}", pieceId);
        
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
            LOGGER.debug("Application du bonus Vizir pour le Leader {}", pieceId);
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
                    LOGGER.debug("Application de la stratégie spéciale : {} pour la pièce {}", ability.getId(), pieceId);
                    validMoves.addAll(strategy.getExtraMoves(piece, allPieces));
                }
            }
        }

        return validMoves;
    }

    // --- Helpers ---

    private void triggerNemesisIfLeaderMoved(PieceEntity movedPiece, UUID gameId) {
        if (!"LEADER".equals(movedPiece.getCharacterId())) return;

        LOGGER.info("Un Leader a bougé. Vérification de la réaction de la Némésis pour le jeu {}", gameId);
        List<PieceEntity> allPieces = pieceRepository.findByGameId(gameId);

        // La Némésis réagit au mouvement du Leader ennemi
        allPieces.stream()
                .filter(p -> "NEMESIS".equals(p.getCharacterId()))
                .filter(p -> !p.getOwnerIndex().equals(movedPiece.getOwnerIndex())) // Némésis Ennemie
                .findFirst()
                .ifPresent(nemesis -> {
                    LOGGER.info("La Némésis {} réagit au mouvement du Leader", nemesis.getId());
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