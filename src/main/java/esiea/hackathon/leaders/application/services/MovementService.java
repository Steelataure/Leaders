package esiea.hackathon.leaders.application.services;

import esiea.hackathon.leaders.domain.model.PieceEntity;
import esiea.hackathon.leaders.domain.repository.PieceRepository;
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
    
    /**
     * Vérifie si deux cases hexagonales sont adjacentes
     */
    public boolean areAdjacent(short q1, short r1, short q2, short r2) {
        int dq = Math.abs(q1 - q2);
        int dr = Math.abs(r1 - r2);
        int ds = Math.abs((q1 + r1) - (q2 + r2));
        
        // Distance hexagonale = (dq + dr + ds) / 2
        // Adjacent = distance 1
        return (dq + dr + ds) / 2 == 1;
    }
    
    /**
     * Récupère toutes les cases adjacentes valides à une position
     */
    public List<HexCoord> getAdjacentCells(short q, short r) {
        // Les 6 directions hexagonales
        List<HexCoord> adjacent = new ArrayList<>();
        adjacent.add(new HexCoord((short)(q + 1), r));
        adjacent.add(new HexCoord((short)(q - 1), r));
        adjacent.add(new HexCoord(q, (short)(r + 1)));
        adjacent.add(new HexCoord(q, (short)(r - 1)));
        adjacent.add(new HexCoord((short)(q + 1), (short)(r - 1)));
        adjacent.add(new HexCoord((short)(q - 1), (short)(r + 1)));
        
        // Garde seulement les cases valides (dans le plateau rayon 3)
        return adjacent.stream()
            .filter(coord -> isValidHexCoord(coord.q(), coord.r()))
            .toList();
    }
    
    /**
     * Vérifie qu'une coordonnée est dans le plateau (rayon 3 = 37 cases)
     */
    public boolean isValidHexCoord(short q, short r) {
        return Math.abs(q) <= 3 && Math.abs(r) <= 3 && Math.abs(q + r) <= 3;
    }
    
    /**
     * Déplace une pièce (avec validation)
     */
    @Transactional
    public PieceEntity movePiece(UUID pieceId, short toQ, short toR) {
        // 1. Récupère la pièce
        PieceEntity pieceEntity = pieceRepository.findById(pieceId)
            .orElseThrow(() -> new IllegalArgumentException("Piece not found: " + pieceId));
        
        // 2. Vérifie que le déplacement est adjacent
        if (!areAdjacent(pieceEntity.getQ(), pieceEntity.getR(), toQ, toR)) {
            throw new IllegalArgumentException(
                "Cannot move from (" + pieceEntity.getQ() + "," + pieceEntity.getR() + ") to (" + toQ + "," + toR + "): not adjacent"
            );
        }
        
        // 3. Vérifie que la case de destination est valide
        if (!isValidHexCoord(toQ, toR)) {
            throw new IllegalArgumentException("Invalid hex coordinates: (" + toQ + "," + toR + ")");
        }
        
        // 4. Vérifie que la case de destination est vide
        pieceRepository.findByGameIdAndPosition(pieceEntity.getGameId(), toQ, toR)
            .ifPresent(occupant -> {
                throw new IllegalArgumentException("Cell (" + toQ + "," + toR + ") is already occupied");
            });
        
        // 5. Déplace la pièce
        pieceEntity.setQ(toQ);
        pieceEntity.setR(toR);
        pieceEntity.setHasActedThisTurn(true);
        
        return pieceRepository.save(pieceEntity);
    }
    
    /**
     * Récupère les cases valides (adjacentes + vides) où une pièce peut se déplacer
     */
    public List<HexCoord> getValidMovesForPiece(UUID pieceId) {
        PieceEntity pieceEntity = pieceRepository.findById(pieceId)
            .orElseThrow(() -> new IllegalArgumentException("Piece not found"));
        
        List<HexCoord> adjacentCells = getAdjacentCells(pieceEntity.getQ(), pieceEntity.getR());
        
        // Garde seulement les cases vides
        return adjacentCells.stream()
            .filter(coord -> pieceRepository.findByGameIdAndPosition(
                pieceEntity.getGameId(), coord.q(), coord.r()
            ).isEmpty())
            .toList();
    }
    
    /**
     * Record pour représenter une coordonnée hexagonale
     */
    public record HexCoord(short q, short r) {}
}