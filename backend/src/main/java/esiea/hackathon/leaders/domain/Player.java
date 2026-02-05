package esiea.hackathon.leaders.domain;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

public class Player {
    private static final Logger LOGGER = LogManager.getLogger(Player.class);
    
    private final String id;
    private String sessionId;

    public Player(String id) {
        this.id = id;
        LOGGER.info("Nouveau joueur créé avec l'ID : {}", id);
    }

    public String getId() {
        return id;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        LOGGER.debug("Mise à jour de la session pour le joueur {} : {} -> {}", id, this.sessionId, sessionId);
        this.sessionId = sessionId;
    }
}