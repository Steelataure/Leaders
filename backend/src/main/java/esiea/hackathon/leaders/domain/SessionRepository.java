package esiea.hackathon.leaders.domain;

import java.util.Optional;

public interface SessionRepository {
    void save(Session session);

    Optional<Session> findById(String id);

    Optional<Session> findFirstByStatusAndIsPrivateFalse(Session.SessionStatus status);

    Optional<Session> findByCode(String code);

    Optional<Session> findSuitableSession(String excludedPlayerId);

    java.util.List<Session> findAll();
}
