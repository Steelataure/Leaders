package esiea.hackathon.leaders.adapter.controller;

import esiea.hackathon.leaders.domain.Session;
import esiea.hackathon.leaders.domain.SessionRepository;
import esiea.hackathon.leaders.usecase.CreateGameSessionUseCase;
import esiea.hackathon.leaders.usecase.JoinPrivateSessionUseCase;
import esiea.hackathon.leaders.usecase.MatchmakingUseCase;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/sessions")
@CrossOrigin(origins = "*")
public class SessionController {

    private final MatchmakingUseCase matchmakingUseCase;
    private final CreateGameSessionUseCase createGameSessionUseCase;
    private final JoinPrivateSessionUseCase joinPrivateSessionUseCase;
    private final SessionRepository sessionRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public SessionController(MatchmakingUseCase matchmakingUseCase,
            CreateGameSessionUseCase createGameSessionUseCase,
            JoinPrivateSessionUseCase joinPrivateSessionUseCase,
            SessionRepository sessionRepository,
            SimpMessagingTemplate messagingTemplate) {
        this.matchmakingUseCase = matchmakingUseCase;
        this.createGameSessionUseCase = createGameSessionUseCase;
        this.joinPrivateSessionUseCase = joinPrivateSessionUseCase;
        this.sessionRepository = sessionRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @PostMapping("/matchmaking")
    public ResponseEntity<Session> joinPublicQueue(@RequestBody(required = false) Map<String, String> body) {
        String playerId = (body != null) ? body.get("playerId") : null;
        Session session = matchmakingUseCase.findOrCreatePublicSession(playerId);
        // notifySessionUpdate(session); // Redundant: ConnectPlayerUseCase already
        // notifies
        return ResponseEntity.ok(session);
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

    private void notifySessionUpdate(Session session) {
        // Notify subscribers of this session (e.g. waiting player)
        messagingTemplate.convertAndSend("/topic/session/" + session.getId(), session);
    }

    @GetMapping("/debug")
    public ResponseEntity<java.util.List<Session>> getAllSessions() {
        return ResponseEntity.ok(sessionRepository.findAll());
    }
}
