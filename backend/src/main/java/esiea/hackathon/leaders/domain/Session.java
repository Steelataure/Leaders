package esiea.hackathon.leaders.domain;

public class Session {
    private final String id;
    private Player player1;
    private Player player2;
    private SessionStatus status;

    public Session(String id, Player player1) {
        this.id = id;
        this.player1 = player1;
        this.player1.setSessionId(id);
        this.status = SessionStatus.WAITING_FOR_PLAYER;
    }

    private boolean isPrivate;
    private String code;

    public Session(String id, Player player1, boolean isPrivate, String code) {
        this.id = id;
        this.player1 = player1;
        this.player1.setSessionId(id);
        this.status = SessionStatus.WAITING_FOR_PLAYER;
        this.isPrivate = isPrivate;
        this.code = code;
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
            throw new IllegalStateException("Session is full");
        }
        this.player2 = player2;
        this.player2.setSessionId(id);
        this.status = SessionStatus.ACTIVE;
    }

    public void finish() {
        this.status = SessionStatus.FINISHED;
    }

    public boolean isPrivate() {
        return isPrivate;
    }

    public String getCode() {
        return code;
    }

    public enum SessionStatus {
        WAITING_FOR_PLAYER,
        ACTIVE,
        FINISHED
    }
}
