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
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.util.UUID;

@RestController
@RequestMapping("/api/games/{gameId}")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ActionController {

    private static final Logger LOGGER = LogManager.getLogger(ActionController.class);

    private final MovementService movementService;
    private final ActionService actionService;
    private final RecruitmentService recruitmentService;
    private final GameRepository gameRepository;

    // 1. Déplacer une pièce
    @PostMapping("/move")
    public ResponseEntity<Void> movePiece(@PathVariable UUID gameId, @RequestBody MoveRequestDto request) {
        // Note: Idéalement, on vérifierait ici si la pièce appartient bien au joueur courant via gameId
        LOGGER.info("Tentative de déplacement de la pièce {} dans la partie {}", request.pieceId(), gameId);
        
        movementService.movePiece(request.pieceId(), request.destination().q(), request.destination().r());
        
        LOGGER.info("Pièce {} déplacée avec succès vers q:{}, r:{}", request.pieceId(), request.destination().q(), request.destination().r());
        return ResponseEntity.ok().build();
    }

    // 2. Utiliser une compétence
    @PostMapping("/action")
    public ResponseEntity<Void> useAbility(@PathVariable UUID gameId, @RequestBody ActionRequestDto request) {
        LOGGER.info("Utilisation de la compétence {} par la source {} dans la partie {}", request.abilityId(), request.sourceId(), gameId);
        
        actionService.useAbility(
                request.sourceId(),
                request.targetId(),
                request.abilityId(),
                request.destination()
        );
        
        LOGGER.info("Compétence {} exécutée avec succès", request.abilityId());
        return ResponseEntity.ok().build();
    }

    // 3. Recruter un personnage
    @PostMapping("/recruit")
    public ResponseEntity<Void> recruit(@PathVariable UUID gameId, @RequestBody RecruitmentRequestDto request) {
        // On récupère le jeu pour savoir qui est le joueur courant
        LOGGER.info("Demande de recrutement reçue pour la partie {}", gameId);

        GameEntity game = gameRepository.findById(gameId)
                .orElseThrow(() -> {
                    LOGGER.error("Erreur : Partie introuvable pour l'ID {}", gameId);
                    return new IllegalArgumentException("Game not found");
                });

        Short currentPlayerIndex = (short) game.getCurrentPlayerIndex();
        LOGGER.info("Recrutement pour le joueur d'index {}", currentPlayerIndex);

        recruitmentService.recruit(
                gameId,
                currentPlayerIndex,
                request.cardId(),
                request.placements()
        );

        LOGGER.info("Recrutement de la carte {} réussi pour le joueur {}", request.cardId(), currentPlayerIndex);
        return ResponseEntity.ok().build();
    }
}