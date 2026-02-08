package esiea.hackathon.leaders.domain;

public class Player {
    private final String id;
    private String sessionId;

    public Player(String id) {
        this.id = id;
    }

    public String getId() {
        return id;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }
}
