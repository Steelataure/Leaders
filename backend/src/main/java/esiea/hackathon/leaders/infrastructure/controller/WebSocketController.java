package esiea.hackathon.leaders.infrastructure.controller;

import esiea.hackathon.leaders.application.dto.chat.ChatMessageDto;
import esiea.hackathon.leaders.domain.Session;
import esiea.hackathon.leaders.usecase.ConnectPlayerUseCase;
import esiea.hackathon.leaders.usecase.CreateGameSessionUseCase;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;
import java.util.Map;

@Controller
public class WebSocketController {

    private final CreateGameSessionUseCase createGameSessionUseCase;
    private final ConnectPlayerUseCase connectPlayerUseCase;
    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketController(CreateGameSessionUseCase createGameSessionUseCase,
            ConnectPlayerUseCase connectPlayerUseCase,
            SimpMessagingTemplate messagingTemplate) {
        this.createGameSessionUseCase = createGameSessionUseCase;
        this.connectPlayerUseCase = connectPlayerUseCase;
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/create")
    @SendTo("/topic/session")
    public Session createSession() {
        System.out.println("Received request to create session");
        try {
            // WebSocket creation doesn't currently support passing playerId, defaulting to
            // random
            Session session = createGameSessionUseCase.createSession(false, null);
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
            String playerId = payload.get("playerId"); // Extract if available
            Session session = connectPlayerUseCase.connect(sessionId, playerId);
            System.out.println("Player joined session: " + sessionId);
            return session;
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
    }

    @MessageMapping("/chat/{sessionId}")
    public void handleChatMessage(@DestinationVariable String sessionId, ChatMessageDto message) {
        System.out.println("Received chat message for session " + sessionId + ": " + message.getContent());
        message.setTimestamp(LocalDateTime.now());
        messagingTemplate.convertAndSend("/topic/chat/" + sessionId, message);
    }
}
