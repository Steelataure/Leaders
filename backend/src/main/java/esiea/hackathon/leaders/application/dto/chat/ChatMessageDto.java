package esiea.hackathon.leaders.application.dto.chat;

public class ChatMessageDto {
    private String sessionId;
    private String senderId;
    private String senderName;
    private String content;
    private long timestamp;

    public ChatMessageDto() {
        this.timestamp = System.currentTimeMillis();
    }

    public ChatMessageDto(String sessionId, String senderId, String senderName, String content) {
        this.sessionId = sessionId;
        this.senderId = senderId;
        this.senderName = senderName;
        this.content = content;
        this.timestamp = System.currentTimeMillis();
    }

    // Getters and Setters
    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getSenderId() {
        return senderId;
    }

    public void setSenderId(String senderId) {
        this.senderId = senderId;
    }

    public String getSenderName() {
        return senderName;
    }

    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }
}
