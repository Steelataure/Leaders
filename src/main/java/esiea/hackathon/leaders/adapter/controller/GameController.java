package esiea.hackathon.leaders.adapter.controller;

import esiea.hackathon.leaders.application.dto.response.GameStateDto;
import esiea.hackathon.leaders.application.services.GameQueryService;
import esiea.hackathon.leaders.application.services.GameService;
import esiea.hackathon.leaders.application.services.GameSetupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/games")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class GameController {

    private final GameSetupService setupService;
    private final GameService gameService;
    private final GameQueryService gameQueryService;

    // 1. Créer une nouvelle partie
    @PostMapping
    public ResponseEntity<UUID> createGame() {
        UUID gameId = setupService.createGame();
        return ResponseEntity.ok(gameId);
    }

    // 2. Récupérer l'état du jeu (Polling par le front)
    @GetMapping("/{gameId}")
    public ResponseEntity<GameStateDto> getGameState(@PathVariable UUID gameId) {
        return ResponseEntity.ok(gameQueryService.getGameState(gameId));
    }

    // 3. Finir le tour
    @PostMapping("/{gameId}/end-turn")
    public ResponseEntity<Void> endTurn(@PathVariable UUID gameId) {
        gameService.endTurn(gameId);
        return ResponseEntity.ok().build();
    }
}