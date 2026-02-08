package esiea.hackathon.leaders.adapter.controller;

import esiea.hackathon.leaders.domain.Session;
import esiea.hackathon.leaders.domain.SessionRepository;
import esiea.hackathon.leaders.usecase.CreateGameSessionUseCase;
import esiea.hackathon.leaders.usecase.JoinPrivateSessionUseCase;
import esiea.hackathon.leaders.usecase.MatchmakingUseCase;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {

    private final MatchmakingUseCase matchmakingUseCase;
    private final CreateGameSessionUseCase createGameSessionUseCase;
    private final JoinPrivateSessionUseCase joinPrivateSessionUseCase;
    private final SessionRepository sessionRepository;

    public SessionController(MatchmakingUseCase matchmakingUseCase,
            CreateGameSessionUseCase createGameSessionUseCase,
            JoinPrivateSessionUseCase joinPrivateSessionUseCase,
            SessionRepository sessionRepository) {
        this.matchmakingUseCase = matchmakingUseCase;
        this.createGameSessionUseCase = createGameSessionUseCase;
        this.joinPrivateSessionUseCase = joinPrivateSessionUseCase;
        this.sessionRepository = sessionRepository;
    }

    @PostMapping("/matchmaking")
    public ResponseEntity<?> joinPublicQueue(@RequestBody(required = false) Map<String, String> body) {
        try {
            String playerId = (body != null) ? body.get("playerId") : null;
            Session session = matchmakingUseCase.findOrCreatePublicSession(playerId);
            return ResponseEntity.ok(session);
        } catch (Exception e) {
            System.err.println("FATAL: Matchmaking endpoint failed: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/matchmaking/cancel")
    public ResponseEntity<?> cancelSearch(@RequestBody Map<String, String> body) {
        String playerId = body.get("playerId");
        if (playerId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "playerId is required"));
        }
        matchmakingUseCase.removePlayerFromQueue(playerId);
        return ResponseEntity.ok(Map.of("message", "Search cancelled"));
    }

    @PostMapping("/private")
    public ResponseEntity<Session> createPrivateSession(@RequestBody(required = false) Map<String, String> body) {
        String playerId = (body != null) ? body.get("playerId") : null;
        Session session = createGameSessionUseCase.createSession(true, playerId);
        return ResponseEntity.ok(session);
    }

    @PostMapping("/private/join")
    public ResponseEntity<Session> joinPrivateSession(@RequestBody Map<String, String> body) {
        String code = body.get("code");
        String playerId = body.get("playerId");
        if (code == null) {
            return ResponseEntity.badRequest().build();
        }
        try {
            Session session = joinPrivateSessionUseCase.joinByCode(code, playerId);
            // notifySessionUpdate(session); // Redundant: ConnectPlayerUseCase already
            // notifies
            return ResponseEntity.ok(session);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<Session> getSession(@PathVariable String sessionId) {
        Optional<Session> session = sessionRepository.findById(sessionId);
        return session.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/debug")
    public ResponseEntity<java.util.List<Map<String, Object>>> getAllSessions() {
        java.util.List<Map<String, Object>> debugInfo = sessionRepository.findAll().stream()
                .map(s -> {
                    Map<String, Object> map = new java.util.HashMap<>();
                    map.put("id", s.getId());
                    map.put("status", s.getStatus());
                    map.put("private", s.isPrivate());
                    map.put("code", s.getCode());
                    map.put("player1", s.getPlayer1() != null ? s.getPlayer1().getId() : "null");
                    map.put("player2", s.getPlayer2() != null ? s.getPlayer2().getId() : "null");
                    return map;
                })
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(debugInfo);
    }
}
