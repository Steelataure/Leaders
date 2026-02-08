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
public class GameController {

    private final GameSetupService setupService;
    private final GameService gameService;
    private final GameQueryService gameQueryService;
    private final SimpMessagingTemplate messagingTemplate;

    @PostMapping
    public ResponseEntity<UUID> createGame(@RequestBody(required = false) CreateGameRequestDto request) {
        // 1. Extraction des données du DTO
        List<String> forcedDeck = (request != null) ? request.forcedDeck() : null;
        UUID requestedId = (request != null) ? request.gameId() : null;

        // 2. Logique de création sécurisée
        UUID finalGameId;

        if (requestedId != null) {
            try {
                // On vérifie si la partie existe déjà via le QueryService
                // Si getGameState ne lance pas d'exception, c'est que la partie existe
                gameQueryService.getGameState(requestedId);
                finalGameId = requestedId;
            } catch (Exception e) {
                // Si elle n'existe pas (exception), on la crée avec l'ID demandé
                finalGameId = setupService.createGameWithId(requestedId, forcedDeck);
            }
        } else {
            // Pas d'ID fourni : création classique avec UUID généré par le serveur
            finalGameId = setupService.createGame(forcedDeck);
        }

        return ResponseEntity.ok(finalGameId);
    }

    @GetMapping("/{gameId}")
    public ResponseEntity<GameStateDto> getGameState(@PathVariable UUID gameId) {
        return ResponseEntity.ok(gameQueryService.getGameState(gameId));
    }

    @PostMapping("/{gameId}/end-turn")
    public ResponseEntity<GameStateDto> endTurn(@PathVariable UUID gameId) {
        // Effectuer l'action
        gameService.endTurn(gameId);

        // Récupérer l'état mis à jour
        GameStateDto updatedGameState = gameQueryService.getGameState(gameId);

        // Notifier les clients via WebSocket
        messagingTemplate.convertAndSend("/topic/game/" + gameId, updatedGameState);

        return ResponseEntity.ok(updatedGameState);
    }
}