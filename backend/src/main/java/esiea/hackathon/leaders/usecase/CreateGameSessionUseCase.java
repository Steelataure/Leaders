package esiea.hackathon.leaders.usecase;

import esiea.hackathon.leaders.domain.Player;
import esiea.hackathon.leaders.domain.Session;
import esiea.hackathon.leaders.domain.SessionRepository;
import java.util.UUID;

public class CreateGameSessionUseCase {
    private final SessionRepository sessionRepository;

    public CreateGameSessionUseCase(SessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    public Session createSession(boolean isPrivate, String playerId) {
        String sessionId = UUID.randomUUID().toString();
        // If playerId is not provided, generate one (fallback)
        String actualPlayerId = (playerId != null) ? playerId : UUID.randomUUID().toString();
        Player player1 = new Player(actualPlayerId);

        String code = isPrivate ? generateCode() : null;

        Session session = new Session(sessionId, player1, isPrivate, code);
        sessionRepository.save(session);

        return session;
    }

    private String generateCode() {
        return String.format("%06d", new java.util.Random().nextInt(1000000));
    }
}
