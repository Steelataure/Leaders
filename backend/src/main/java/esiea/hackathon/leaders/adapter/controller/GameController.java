package esiea.hackathon.leaders.adapter.controller;

import esiea.hackathon.leaders.application.dto.request.CreateGameRequestDto;
import esiea.hackathon.leaders.application.dto.response.GameStateDto;
import esiea.hackathon.leaders.application.services.GameQueryService;
import esiea.hackathon.leaders.application.services.GameService;
import esiea.hackathon.leaders.application.services.GameSetupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/games")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class GameController {

    private static final Logger LOGGER = LogManager.getLogger(GameController.class);

    private final GameSetupService setupService;
    private final GameService gameService;
    private final GameQueryService gameQueryService;

    @PostMapping
    public ResponseEntity<UUID> createGame(@RequestBody(required = false) CreateGameRequestDto request) {
        LOGGER.info("Requête reçue pour la création d'une nouvelle partie.");
        
        List<String> forcedDeck = (request != null) ? request.forcedDeck() : null;
        UUID gameId = setupService.createGame(forcedDeck);
        
        LOGGER.info("Partie créée avec succès. ID : {}", gameId);
        return ResponseEntity.ok(gameId);
    }

    @GetMapping("/{gameId}")
    public ResponseEntity<GameStateDto> getGameState(@PathVariable UUID gameId) {
        LOGGER.info("Récupération de l'état de la partie pour l'ID : {}", gameId);
        return ResponseEntity.ok(gameQueryService.getGameState(gameId));
    }

    // --- C'EST ICI LA CORRECTION ---
    @PostMapping("/{gameId}/end-turn")
    public ResponseEntity<GameStateDto> endTurn(@PathVariable UUID gameId) {
        LOGGER.info("Demande de fin de tour pour la partie : {}", gameId);

        // 1. On effectue l'action (qui modifie la base de données)
        gameService.endTurn(gameId);
        LOGGER.debug("Fin de tour traitée par le service pour la partie : {}", gameId);

        // 2. On récupère l'état à jour via ton QueryService (qui gère déjà le mapping manuel)
        GameStateDto updatedGameState = gameQueryService.getGameState(gameId);
        
        LOGGER.info("Tour terminé et état mis à jour récupéré pour la partie : {}", gameId);

        // 3. On renvoie le DTO (Status 200 OK avec Body)
        return ResponseEntity.ok(updatedGameState);
    }
}