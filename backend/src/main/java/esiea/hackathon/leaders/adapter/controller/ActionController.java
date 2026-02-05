package esiea.hackathon.leaders.adapter.controller;

import esiea.hackathon.leaders.application.dto.request.ActionRequestDto;
import esiea.hackathon.leaders.application.dto.request.MoveRequestDto;
import esiea.hackathon.leaders.application.dto.request.RecruitmentRequestDto;
import esiea.hackathon.leaders.application.services.ActionService;
import esiea.hackathon.leaders.application.services.MovementService;
import esiea.hackathon.leaders.application.services.RecruitmentService;
import esiea.hackathon.leaders.domain.model.GameEntity;
import esiea.hackathon.leaders.domain.repository.GameRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/games/{gameId}")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ActionController {

    private final MovementService movementService;
    private final ActionService actionService;
    private final RecruitmentService recruitmentService;
    private final GameRepository gameRepository;

    // 1. Déplacer une pièce
    @PostMapping("/move")
    public ResponseEntity<Void> movePiece(@PathVariable UUID gameId, @RequestBody MoveRequestDto request) {
        // Note: Idéalement, on vérifierait ici si la pièce appartient bien au joueur courant via gameId
        movementService.movePiece(request.pieceId(), request.destination().q(), request.destination().r());
        return ResponseEntity.ok().build();
    }

    // 2. Utiliser une compétence
    @PostMapping("/action")
    public ResponseEntity<Void> useAbility(@PathVariable UUID gameId, @RequestBody ActionRequestDto request) {
        actionService.useAbility(
                request.sourceId(),
                request.targetId(),
                request.abilityId(),
                request.destination()
        );
        return ResponseEntity.ok().build();
    }

    // 3. Recruter un personnage
    @PostMapping("/recruit")
    public ResponseEntity<Void> recruit(@PathVariable UUID gameId, @RequestBody RecruitmentRequestDto request) {
        // On récupère le jeu pour savoir qui est le joueur courant
        GameEntity game = gameRepository.findById(gameId)
                .orElseThrow(() -> new IllegalArgumentException("Game not found"));

        Short currentPlayerIndex = (short) game.getCurrentPlayerIndex();

        recruitmentService.recruit(
                gameId,
                currentPlayerIndex,
                request.cardId(),
                request.placements()
        );
        return ResponseEntity.ok().build();
    }
}