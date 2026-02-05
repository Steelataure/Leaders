package esiea.hackathon.leaders.domain;

import java.util.Optional;

public interface SessionRepository {
    void save(Session session);
    Optional<Session> findById(String id);
}
