package esiea.hackathon.leaders.adapter.controller;

import esiea.hackathon.leaders.domain.model.Piece;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import esiea.hackathon.leaders.domain.repository.PieceRepository;
import esiea.hackathon.leaders.application.services.MovementService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/pieces")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Pour que le front puisse appeler l'API
public class PieceController {
    
    private final PieceRepository pieceRepository;
    private final MovementService movementService;
    
    /**
     * GET /api/pieces?gameId=xxx
     * Récupère toutes les pièces d'une partie
     */
    @GetMapping
    public List<Piece> getPiecesByGame(@RequestParam UUID gameId) {
        return pieceRepository.findByGameId(gameId);
    }
    
    /**
     * GET /api/pieces/{pieceId}/valid-moves
     * Récupère les cases valides où une pièce peut se déplacer
     */
    @GetMapping("/{pieceId}/valid-moves")
    public List<MovementService.HexCoord> getValidMoves(@PathVariable UUID pieceId) {
        return movementService.getValidMovesForPiece(pieceId);
    }
    
    /**
     * POST /api/pieces/{pieceId}/move
     * Déplace une pièce
     */
    @PostMapping("/{pieceId}/move")
    public ResponseEntity<Piece> movePiece(
        @PathVariable UUID pieceId,
        @RequestBody MoveRequest request
    ) {
        try {
            Piece movedPiece = movementService.movePiece(pieceId, request.toQ, request.toR);
            return ResponseEntity.ok(movedPiece);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * DTO pour la requête de déplacement
     */
    public record MoveRequest(short toQ, short toR) {}
}