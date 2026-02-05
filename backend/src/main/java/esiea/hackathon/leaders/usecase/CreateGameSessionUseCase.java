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

    public Session createSession() {
        String sessionId = UUID.randomUUID().toString();
        String playerId = UUID.randomUUID().toString();
        Player player1 = new Player(playerId);

        Session session = new Session(sessionId, player1);
        sessionRepository.save(session);

        return session;
    }
}
