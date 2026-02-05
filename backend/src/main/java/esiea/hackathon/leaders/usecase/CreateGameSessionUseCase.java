package esiea.hackathon.leaders.usecase;

import esiea.hackathon.leaders.domain.Player;
import esiea.hackathon.leaders.domain.Session;
import esiea.hackathon.leaders.domain.SessionRepository;
import java.util.UUID;

import org.apache.logging.log4j.LogManager; 
import org.apache.logging.log4j.Logger; 

public class CreateGameSessionUseCase {
    private static final Logger LOGGER = LogManager.getLogger(CreateGameSessionUseCase.class);
    private final SessionRepository sessionRepository;

    public CreateGameSessionUseCase(SessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    public Session createSession() {
        LOGGER.info("Début de la création d'une nouvelle session de jeu.");

        String sessionId = UUID.randomUUID().toString();
        String playerId = UUID.randomUUID().toString();
        
        LOGGER.debug("Génération des identifiants - Session: {}, Joueur: {}", sessionId, playerId);

        Player player1 = new Player(playerId);
        Session session = new Session(sessionId, player1);

        sessionRepository.save(session);
        LOGGER.info("Session {} enregistrée avec succès pour le joueur {}.", sessionId, playerId);

        return session;
    }
}