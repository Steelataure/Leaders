package esiea.hackathon.leaders.domain;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

public class Session {
    private static final Logger LOGGER = LogManager.getLogger(Session.class);

    private final String id;
    private Player player1;
    private Player player2;
    private SessionStatus status;

    public Session(String id, Player player1) {
        this.id = id;
        this.player1 = player1;
        this.player1.setSessionId(id);
        this.status = SessionStatus.WAITING_FOR_PLAYER;
        LOGGER.info("Nouvelle session créée avec l'ID : {} pour le joueur : {}", id, player1.getId());
    }

    public String getId() {
        return id;
    }

    public Player getPlayer1() {
        return player1;
    }

    public Player getPlayer2() {
        return player2;
    }

    public SessionStatus getStatus() {
        return status;
    }

    public void join(Player player2) {
        if (this.player2 != null) {
            LOGGER.error("Tentative de rejoindre la session {} échouée : la session est déjà complète", id);
            throw new IllegalStateException("Session is full");
        }
        this.player2 = player2;
        this.player2.setSessionId(id);
        this.status = SessionStatus.ACTIVE;
        LOGGER.info("Le joueur {} a rejoint la session {}. Statut : {}", player2.getId(), id, status);
    }

    public enum SessionStatus {
        WAITING_FOR_PLAYER,
        ACTIVE,
        FINISHED
    }
}