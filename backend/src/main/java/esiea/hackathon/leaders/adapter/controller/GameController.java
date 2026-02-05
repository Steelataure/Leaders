package esiea.hackathon.leaders.adapter.controller;

import esiea.hackathon.leaders.application.dto.request.CreateGameRequestDto;
import esiea.hackathon.leaders.application.dto.response.GameStateDto;
import esiea.hackathon.leaders.application.services.GameQueryService;
import esiea.hackathon.leaders.application.services.GameService;
import esiea.hackathon.leaders.application.services.GameSetupService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/games")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class GameController {

    private final GameSetupService setupService;
    private final GameService gameService;
    private final GameQueryService gameQueryService;

    private final SimpMessagingTemplate messagingTemplate;

    @PostMapping
    public ResponseEntity<UUID> createGame(@RequestBody(required = false) CreateGameRequestDto request) {
        List<String> forcedDeck = (request != null) ? request.forcedDeck() : null;
        UUID gameId;
        if (request != null && request.gameId() != null) {
            gameId = setupService.createGameWithId(request.gameId(), forcedDeck);
        } else {
            gameId = setupService.createGame(forcedDeck);
        }
        return ResponseEntity.ok(gameId);
    }

    @GetMapping("/{gameId}")
    public ResponseEntity<GameStateDto> getGameState(@PathVariable UUID gameId) {
        return ResponseEntity.ok(gameQueryService.getGameState(gameId));
    }

    // --- C'EST ICI LA CORRECTION ---
    @PostMapping("/{gameId}/end-turn")
    public ResponseEntity<GameStateDto> endTurn(@PathVariable UUID gameId) {
        // 1. On effectue l'action (qui modifie la base de données)
        gameService.endTurn(gameId);

        // 2. On récupère l'état à jour via ton QueryService (qui gère déjà le mapping
        // manuel)
        GameStateDto updatedGameState = gameQueryService.getGameState(gameId);

        // 3. On notifie les abonnés WebSocket
        messagingTemplate.convertAndSend("/topic/game/" + gameId, updatedGameState);

        // 4. On renvoie le DTO (Status 200 OK avec Body)
        return ResponseEntity.ok(updatedGameState);
    }
}