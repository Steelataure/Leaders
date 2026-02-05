package esiea.hackathon.leaders.infrastructure.controller;

import esiea.hackathon.leaders.domain.Session;
import esiea.hackathon.leaders.usecase.ConnectPlayerUseCase;
import esiea.hackathon.leaders.usecase.CreateGameSessionUseCase;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

@Controller
public class WebSocketController {

    private final CreateGameSessionUseCase createGameSessionUseCase;
    private final ConnectPlayerUseCase connectPlayerUseCase;

    public WebSocketController(CreateGameSessionUseCase createGameSessionUseCase,
            ConnectPlayerUseCase connectPlayerUseCase) {
        this.createGameSessionUseCase = createGameSessionUseCase;
        this.connectPlayerUseCase = connectPlayerUseCase;
    }

    @MessageMapping("/create")
    @SendTo("/topic/session")
    public Session createSession() {
        System.out.println("Received request to create session");
        try {
            Session session = createGameSessionUseCase.createSession();
            System.out.println("Session created: " + session.getId());
            return session;
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
    }

    @MessageMapping("/join")
    @SendTo("/topic/session")
    public Session joinSession(Map<String, String> payload) {
        System.out.println("Received request to join session: " + payload);
        try {
            String sessionId = payload.get("sessionId");
            Session session = connectPlayerUseCase.connect(sessionId);
            System.out.println("Player joined session: " + sessionId);
            return session;
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
    }
}
