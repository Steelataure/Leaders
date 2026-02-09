package esiea.hackathon.leaders.domain;

public class Session {
    private final String id;
    private Player player1;
    private Player player2;
    private SessionStatus status;
    private long lastHeartbeat;

    public Session(String id, Player player1) {
        this.id = id;
        this.player1 = player1;
        this.player1.setSessionId(id);
        this.status = SessionStatus.WAITING_FOR_PLAYER;
        this.lastHeartbeat = System.currentTimeMillis();
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
        this.lastHeartbeat = System.currentTimeMillis();
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

    public void setStatus(SessionStatus status) {
        this.status = status;
    }

    public void setPlayer1(Player player1) {
        this.player1 = player1;
    }

    public void setPlayer2(Player player2) {
        this.player2 = player2;
    }

    public long getLastHeartbeat() {
        return lastHeartbeat;
    }

    public void setLastHeartbeat(long lastHeartbeat) {
        this.lastHeartbeat = lastHeartbeat;
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
