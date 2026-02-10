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
@RequestMapping("/games")
@RequiredArgsConstructor
public class GameController {

    private final GameSetupService setupService;
    private final GameService gameService;
    private final GameQueryService gameQueryService;
    private final SimpMessagingTemplate messagingTemplate;
    private final esiea.hackathon.leaders.usecase.StartAiGameUseCase startAiGameUseCase;
    private final esiea.hackathon.leaders.application.services.AiService aiService;

    @PostMapping("/ai")
    public ResponseEntity<UUID> createAiGame(@RequestBody java.util.Map<String, String> body) {
        String playerIdStr = body.get("playerId");
        if (playerIdStr == null) {
            return ResponseEntity.badRequest().build();
        }
        UUID playerId = UUID.fromString(playerIdStr);

        String difficultyStr = body.get("difficulty");
        esiea.hackathon.leaders.domain.model.enums.AiDifficulty difficulty = esiea.hackathon.leaders.domain.model.enums.AiDifficulty.EASY;
        if (difficultyStr != null) {
            try {
                difficulty = esiea.hackathon.leaders.domain.model.enums.AiDifficulty.valueOf(difficultyStr);
            } catch (IllegalArgumentException e) {
                // Ignore invalid difficulty, use default
            }
        }

        UUID gameId = startAiGameUseCase.startAiGame(playerId, difficulty);
        return ResponseEntity.ok(gameId);
    }

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
        // Vérification du timeout à chaque appel
        try {
            gameService.checkTimeout(gameId);
        } catch (Exception e) {
            // Log silentieux, on veut quand même renvoyer l'état
            System.err.println("Error checking timeout: " + e.getMessage());
        }
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

        // TRIGGER AI (After Transaction Commit)
        if (updatedGameState.status() == esiea.hackathon.leaders.domain.model.enums.GameStatus.IN_PROGRESS) {
            esiea.hackathon.leaders.application.dto.response.PlayerDto currentPlayer = updatedGameState.players()
                    .stream()
                    .filter(p -> p.playerIndex() == updatedGameState.currentPlayerIndex())
                    .findFirst().orElse(null);

            if (currentPlayer != null && esiea.hackathon.leaders.application.services.AiService.AI_PLAYER_ID
                    .equals(currentPlayer.userId())) {
                System.out.println("DEBUG: Controller triggering AI interaction for game " + gameId);
                aiService.playTurn(gameId);
            }
        }

        return ResponseEntity.ok(updatedGameState);
    }

    @PostMapping("/{gameId}/surrender")
    public ResponseEntity<GameStateDto> surrender(@PathVariable UUID gameId,
            @RequestBody java.util.Map<String, String> body) {
        String playerId = body.get("playerId");
        if (playerId == null) {
            return ResponseEntity.badRequest().build();
        }

        gameService.surrender(gameId, playerId);

        // Get updated state and notify
        GameStateDto updatedGameState = gameQueryService.getGameState(gameId);
        messagingTemplate.convertAndSend("/topic/game/" + gameId, updatedGameState);

        return ResponseEntity.ok(updatedGameState);
    }
}