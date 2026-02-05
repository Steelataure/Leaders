package esiea.hackathon.leaders.usecase;

import esiea.hackathon.leaders.domain.Player;
import esiea.hackathon.leaders.domain.Session;
import esiea.hackathon.leaders.domain.SessionRepository;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.util.UUID;
import java.util.Optional;

public class ConnectPlayerUseCase {
    private static final Logger LOGGER = LogManager.getLogger(ConnectPlayerUseCase.class);
    private final SessionRepository sessionRepository;

    public ConnectPlayerUseCase(SessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    public Session connect(String sessionId) {
        LOGGER.info("Tentative de connexion d'un joueur à la session : {}", sessionId);

        Optional<Session> sessionOpt = sessionRepository.findById(sessionId);

        if (sessionOpt.isEmpty()) {
            LOGGER.error("Échec de la connexion : la session {} n'existe pas", sessionId);
            throw new IllegalArgumentException("Session not found: " + sessionId);
        }

        Session session = sessionOpt.get();
        String playerId = UUID.randomUUID().toString();
        Player player2 = new Player(playerId);

        session.join(player2);
        sessionRepository.save(session);

        LOGGER.info("Le joueur {} a rejoint avec succès la session {}", playerId, sessionId);

        return session;
    }
}