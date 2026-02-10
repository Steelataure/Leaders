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
        System.out.println("DEBUG: Saving session " + session.getId() + " status=" + session.getStatus() + " private="
                + session.isPrivate());
        sessions.put(session.getId(), session);
    }

    @Override
    public Optional<Session> findFirstByStatusAndIsPrivateFalse(Session.SessionStatus status) {
        System.out
                .println("DEBUG: Searching for status=" + status + " private=false. Total sessions=" + sessions.size());
        sessions.values().forEach(s -> System.out
                .println("DEBUG: Candidate " + s.getId() + " status=" + s.getStatus() + " private=" + s.isPrivate()));
        return sessions.values().stream()
                .filter(s -> s.getStatus() == status && !s.isPrivate())
                .findFirst();
    }

    @Override
    public Optional<Session> findByCode(String code) {
        if (code == null)
            return Optional.empty();
        return sessions.values().stream()
                .filter(s -> code.equals(s.getCode()))
                .findFirst();
    }

    @Override
    public Optional<Session> findById(String id) {
        return Optional.ofNullable(sessions.get(id));
    }

    @Override
    public java.util.List<Session> findAll() {
        return new java.util.ArrayList<>(sessions.values());
    }

    @Override
    public Optional<Session> findSuitableSession(String excludedPlayerId) {
        System.out.println("DEBUG: Finding suitable session (any waiting public session)");
        return sessions.values().stream()
                .filter(s -> {
                    boolean isWaiting = s.getStatus() == Session.SessionStatus.WAITING_FOR_PLAYER;
                    boolean notPrivate = !s.isPrivate();

                    if (isWaiting && notPrivate)
                        return true;

                    // Log rejection reason for debugging
                    System.out.println("DEBUG: Rejected " + s.getId() + " Waiting=" + isWaiting +
                            " Public=" + notPrivate);
                    return false;
                })
                .findFirst();
    }

    @Override
    public void deleteAll() {
        sessions.clear();
    }
}
