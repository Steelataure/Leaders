package esiea.hackathon.leaders.adapter.controller;

import esiea.hackathon.leaders.application.dto.response.PieceResponseDto;
import esiea.hackathon.leaders.application.services.MovementService;
import esiea.hackathon.leaders.domain.model.HexCoord;
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
    private final esiea.hackathon.leaders.application.services.GameQueryService gameQueryService;
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

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
    public ResponseEntity<List<HexCoord>> getValidMoves(@PathVariable UUID pieceId) {
        return ResponseEntity.ok(movementService.getValidMovesForPiece(pieceId));
    }

    /**
     * POST /api/pieces/{pieceId}/move
     */
    @PostMapping("/{pieceId}/move")
    public ResponseEntity<?> movePiece(
            @PathVariable UUID pieceId,
            @RequestBody MoveRequest request) {
        try {
            System.out.println("DEBUG: Received move request for piece " + pieceId + " to (" + request.toQ() + ","
                    + request.toR() + ")");
            PieceEntity movedPiece = movementService.movePiece(pieceId, request.toQ(), request.toR());

            // Broadcast update
            esiea.hackathon.leaders.application.dto.response.GameStateDto gameState = gameQueryService
                    .getGameState(movedPiece.getGameId());
            messagingTemplate.convertAndSend("/topic/game/" + movedPiece.getGameId(), gameState);

            return ResponseEntity.ok(toDto(movedPiece));

        } catch (IllegalArgumentException e) {
            System.err.println("ERROR: Move rejected: " + e.getMessage());
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
                domain.getHasActedThisTurn());
    }

    // --- DTOs INTERNES ---

    public record MoveRequest(short toQ, short toR) {
    }

    public record ErrorResponse(String message) {
    }
}