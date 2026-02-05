package esiea.hackathon.leaders.infrastructure.repository;

import esiea.hackathon.leaders.domain.Session;
import esiea.hackathon.leaders.domain.SessionRepository;
import org.springframework.stereotype.Repository;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class InMemorySessionRepository implements SessionRepository {
    private final Map<String, Session> sessions = new ConcurrentHashMap<>();

    @Override
    public void save(Session session) {
        sessions.put(session.getId(), session);
    }

    @Override
    public Optional<Session> findById(String id) {
        return Optional.ofNullable(sessions.get(id));
    }
}
