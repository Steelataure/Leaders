package esiea.hackathon.leaders.infrastructure.controller;

import esiea.hackathon.leaders.domain.Session;
import esiea.hackathon.leaders.usecase.ConnectPlayerUseCase;
import esiea.hackathon.leaders.usecase.CreateGameSessionUseCase;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

@Controller
public class WebSocketController {

    private static final Logger LOGGER = LogManager.getLogger(WebSocketController.class);
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
        LOGGER.info("Réception d'une demande de création de session");
        try {
            Session session = createGameSessionUseCase.createSession();
            LOGGER.info("Session créée avec succès. ID : {}", session.getId());
            return session;
        } catch (Exception e) {
            LOGGER.error("Erreur lors de la création de la session : ", e);
            e.printStackTrace();
            throw e;
        }
    }

    @MessageMapping("/join")
    @SendTo("/topic/session")
    public Session joinSession(Map<String, String> payload) {
        LOGGER.info("Réception d'une demande de connexion à une session. Payload : {}", payload);
        try {
            String sessionId = payload.get("sessionId");
            Session session = connectPlayerUseCase.connect(sessionId);
            LOGGER.info("Un joueur a rejoint la session : {}", sessionId);
            return session;
        } catch (Exception e) {
            LOGGER.error("Erreur lors de la tentative de connexion à la session : ", e);
            e.printStackTrace();
            throw e;
        }
    }
}