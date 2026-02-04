package esiea.hackathon.leaders.application.services;

import esiea.hackathon.leaders.application.strategies.MoveAbilityStrategy;
import esiea.hackathon.leaders.application.strategies.movement.MoveStrategyFactory;
import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import esiea.hackathon.leaders.domain.model.RefCharacterEntity;
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

    /**
     * Déplace une pièce.
     * Cette méthode orchestre tout : elle vérifie si le coup demandé fait partie
     * de la liste des coups légaux calculés par le moteur de règles.
     */
    @Transactional
    public PieceEntity movePiece(UUID pieceId, short toQ, short toR) {
        // 1. Validation technique de la coordonnée (Est-ce dans le plateau ?)
        HexCoord target = new HexCoord(toQ, toR);
        if (!target.isValid()) {
            throw new IllegalArgumentException("Invalid hex coordinates: (" + toQ + "," + toR + ")");
        }

        // 2. Récupère la pièce en base
        PieceEntity pieceEntity = pieceRepository.findById(pieceId)
                .orElseThrow(() -> new IllegalArgumentException("Piece not found: " + pieceId));

        // 3. RECUPERATION DE TOUS LES MOUVEMENTS VALIDES
        List<HexCoord> legalMoves = getValidMovesForPiece(pieceId);

        // 4. Vérification de légalité
        if (!legalMoves.contains(target)) {
            throw new IllegalArgumentException(
                    "Illegal move from (" + pieceEntity.getQ() + "," + pieceEntity.getR() + ") to (" + toQ + "," + toR + ")"
            );
        }

        // 5. Application du déplacement
        pieceEntity.setQ(toQ);
        pieceEntity.setR(toR);
        pieceEntity.setHasActedThisTurn(true);

        return pieceRepository.save(pieceEntity);
    }

    /**
     * Calcule la liste exhaustive des cases où la pièce peut aller.
     * Combine : Mouvements Standards + Mouvements de Compétences (Stratégies)
     */
    public List<HexCoord> getValidMovesForPiece(UUID pieceId) {
        // 1. Chargement des données nécessaires
        PieceEntity piece = pieceRepository.findById(pieceId)
                .orElseThrow(() -> new IllegalArgumentException("Piece not found"));

        RefCharacterEntity character = characterRepository.findById(piece.getCharacterId())
                .orElseThrow(() -> new IllegalStateException("Character definition not found"));

        // On charge tout le plateau pour la détection d'obstacles et les interactions
        List<PieceEntity> allPieces = pieceRepository.findByGameId(piece.getGameId());

        List<HexCoord> validMoves = new ArrayList<>();

        // --- REGLE SPECIALE 1 : La Némésis n'a pas de mouvement standard ---
        // Elle ne bouge qu'en réaction (géré hors de ce service) ou via une action spéciale.
        if (!"NEMESIS".equals(character.getId())) {
            validMoves.addAll(getStandardMoves(piece, allPieces));
        }

        // --- REGLE SPECIALE 2 : Le Leader profite du Boost Vizir ---
        if ("LEADER".equals(character.getId())) {
            MoveAbilityStrategy leaderStrat = strategyFactory.getStrategy("VIZIER_BOOST");
            if (leaderStrat != null) {
                // La stratégie "LeaderBoostStrategy" vérifiera elle-même si un Vizir est vivant
                validMoves.addAll(leaderStrat.getExtraMoves(piece, allPieces));
            }
        }

        // 3. Ajouter les Mouvements Spéciaux via la Factory
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

    // --- Helpers Privés ---

    /**
     * Calcule les mouvements de base (1 case adjacente et vide).
     */
    private List<HexCoord> getStandardMoves(PieceEntity piece, List<PieceEntity> allPieces) {
        return getAdjacentCells(piece.getQ(), piece.getR()).stream()
                // Filtre : la case cible doit être VIDE
                .filter(coord -> isCellEmpty(coord.q(), coord.r(), allPieces))
                .toList();
    }

    /**
     * Génère les 6 voisins théoriques autour d'une coordonnée.
     */
    public List<HexCoord> getAdjacentCells(short q, short r) {
        List<HexCoord> adjacent = new ArrayList<>();
        // Les 6 directions axiales
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

    /**
     * Vérifie si une case est libre en mémoire (évite les requêtes SQL en boucle)
     */
    private boolean isCellEmpty(short q, short r, List<PieceEntity> allPieces) {
        return allPieces.stream().noneMatch(p -> p.getQ() == q && p.getR() == r);
    }

    // Méthode utilitaire exposée si besoin pour d'autres services
    public boolean isValidHexCoord(short q, short r) {
        return new HexCoord(q, r).isValid();
    }
}