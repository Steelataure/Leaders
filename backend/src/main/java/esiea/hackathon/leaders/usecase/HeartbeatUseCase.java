package esiea.hackathon.leaders.usecase;

import esiea.hackathon.leaders.domain.SessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class HeartbeatUseCase {
    private final SessionRepository sessionRepository;

    public void heartbeat(String sessionId) {
        sessionRepository.findById(sessionId).ifPresent(session -> {
            session.setLastHeartbeat(System.currentTimeMillis());
            // Since it's in-memory, save is redundant but good for abstraction
            sessionRepository.save(session);
        });
    }
}
