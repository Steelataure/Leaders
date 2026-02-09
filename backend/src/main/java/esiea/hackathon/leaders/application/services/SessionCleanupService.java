package esiea.hackathon.leaders.application.services;

import esiea.hackathon.leaders.domain.Session;
import esiea.hackathon.leaders.domain.SessionRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SessionCleanupService {

    private final SessionRepository sessionRepository;
    private static final long TIMEOUT_MS = 30000; // 30 seconds timeout

    public SessionCleanupService(SessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    @Scheduled(fixedRate = 10000) // Run every 10 seconds
    public void cleanupStaleSessions() {
        List<Session> sessions = sessionRepository.findAll();
        long now = System.currentTimeMillis();

        for (Session session : sessions) {
            if (session.getStatus() == Session.SessionStatus.ACTIVE
                    || session.getStatus() == Session.SessionStatus.WAITING_FOR_PLAYER) {
                if (now - session.getLastHeartbeat() > TIMEOUT_MS) {
                    System.out.println("Session " + session.getId() + " timed out. Cleaning up.");
                    session.setStatus(Session.SessionStatus.FINISHED);
                    sessionRepository.save(session);
                }
            }
        }
    }
}
