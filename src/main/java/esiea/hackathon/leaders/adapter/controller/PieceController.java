package esiea.hackathon.leaders.adapter.controller;

import esiea.hackathon.leaders.application.dto.PieceResponseDto;
import esiea.hackathon.leaders.application.services.MovementService;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import esiea.hackathon.leaders.domain.repository.PieceRepository;
import lombok.RequiredArgsConstructor;
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

    private final PieceRepository pieceRepository;
    private final MovementService movementService;

    /**
     * GET /api/pieces?gameId=xxx
     */
    @GetMapping
    public ResponseEntity<List<PieceResponseDto>> getPiecesByGame(@RequestParam UUID gameId) {
        List<PieceResponseDto> dtos = pieceRepository.findByGameId(gameId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    /**
     * GET /api/pieces/{pieceId}/valid-moves
     */
    @GetMapping("/{pieceId}/valid-moves")
    public ResponseEntity<List<MovementService.HexCoord>> getValidMoves(@PathVariable UUID pieceId) {
        return ResponseEntity.ok(movementService.getValidMovesForPiece(pieceId));
    }

    /**
     * POST /api/pieces/{pieceId}/move
     */
    @PostMapping("/{pieceId}/move")
    public ResponseEntity<?> movePiece(
                                        @PathVariable UUID pieceId,
                                        @RequestBody MoveRequest request
    ) {
        try {
            PieceEntity movedPiece = movementService.movePiece(pieceId, request.toQ(), request.toR());
            return ResponseEntity.ok(toDto(movedPiece));

        } catch (IllegalArgumentException e) {
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