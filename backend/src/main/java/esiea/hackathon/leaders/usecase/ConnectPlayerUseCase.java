package esiea.hackathon.leaders.usecase;

import esiea.hackathon.leaders.domain.Player;
import esiea.hackathon.leaders.domain.Session;
import esiea.hackathon.leaders.domain.SessionRepository;
import java.util.UUID;
import java.util.Optional;

public class ConnectPlayerUseCase {
    private final SessionRepository sessionRepository;

    public ConnectPlayerUseCase(SessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    public Session connect(String sessionId) {
        Optional<Session> sessionOpt = sessionRepository.findById(sessionId);

        if (sessionOpt.isEmpty()) {
            throw new IllegalArgumentException("Session not found: " + sessionId);
        }

        Session session = sessionOpt.get();
        String playerId = UUID.randomUUID().toString();
        Player player2 = new Player(playerId);

        session.join(player2);
        sessionRepository.save(session);

        return session;
    }
}
