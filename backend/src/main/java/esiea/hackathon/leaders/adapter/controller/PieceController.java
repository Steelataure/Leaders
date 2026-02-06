package esiea.hackathon.leaders.adapter.controller;

import esiea.hackathon.leaders.application.dto.response.PieceResponseDto;
import esiea.hackathon.leaders.application.services.MovementService;
import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import esiea.hackathon.leaders.domain.repository.PieceRepository;
import lombok.RequiredArgsConstructor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/pieces")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PieceController {

    private static final Logger LOGGER = LogManager.getLogger(PieceController.class);

    private final PieceRepository pieceRepository;
    private final MovementService movementService;

    /**
     * GET /api/pieces?gameId=xxx
     */
    @GetMapping
    public ResponseEntity<List<PieceResponseDto>> getPiecesByGame(@RequestParam UUID gameId) {
        LOGGER.info("Récupération des pièces pour la partie : {}", gameId);
        
        List<PieceResponseDto> dtos = pieceRepository.findByGameId(gameId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());

        LOGGER.debug("{} pièces trouvées pour la partie {}", dtos.size(), gameId);
        return ResponseEntity.ok(dtos);
    }

    /**
     * GET /api/pieces/{pieceId}/valid-moves
     */
    @GetMapping("/{pieceId}/valid-moves")
    public ResponseEntity<List<HexCoord>> getValidMoves(@PathVariable UUID pieceId) {
        LOGGER.info("Calcul des déplacements valides pour la pièce : {}", pieceId);
        List<HexCoord> moves = movementService.getValidMovesForPiece(pieceId);
        LOGGER.debug("{} déplacements possibles trouvés pour la pièce {}", moves.size(), pieceId);
        return ResponseEntity.ok(moves);
    }

    /**
     * POST /api/pieces/{pieceId}/move
     */
    @PostMapping("/{pieceId}/move")
    public ResponseEntity<?> movePiece(
                                        @PathVariable UUID pieceId,
                                        @RequestBody MoveRequest request
    ) {
        LOGGER.info("Tentative de déplacement de la pièce {} vers les coordonnées (q:{}, r:{})", 
                pieceId, request.toQ(), request.toR());
        try {
            PieceEntity movedPiece = movementService.movePiece(pieceId, request.toQ(), request.toR());
            LOGGER.info("Déplacement réussi pour la pièce {}", pieceId);
            return ResponseEntity.ok(toDto(movedPiece));

        } catch (IllegalArgumentException e) {
            LOGGER.error("Échec du déplacement pour la pièce {} : {}", pieceId, e.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    private PieceResponseDto toDto(PieceEntity domain) {
        return new PieceResponseDto(
                domain.getId(),
                domain.getCharacterId(),
                domain.getOwnerIndex(),
                domain.getQ(),
                domain.getR(),
                domain.getHasActedThisTurn()
        );
    }

    // --- DTOs INTERNES ---

    public record MoveRequest(short toQ, short toR) {}
    public record ErrorResponse(String message) {}
}