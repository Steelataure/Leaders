package esiea.hackathon.leaders.usecase;

import esiea.hackathon.leaders.domain.Session;
import esiea.hackathon.leaders.domain.SessionRepository;

import java.util.Optional;

public class JoinPrivateSessionUseCase {
    private final SessionRepository sessionRepository;
    private final ConnectPlayerUseCase connectPlayerUseCase;

    public JoinPrivateSessionUseCase(SessionRepository sessionRepository, ConnectPlayerUseCase connectPlayerUseCase) {
        this.sessionRepository = sessionRepository;
        this.connectPlayerUseCase = connectPlayerUseCase;
    }

    public Session joinByCode(String code, String playerId) {
        Optional<Session> sessionOpt = sessionRepository.findByCode(code);

        if (sessionOpt.isEmpty()) {
            throw new IllegalArgumentException("Invalid code: " + code);
        }

        Session session = sessionOpt.get();
        if (session.getStatus() != Session.SessionStatus.WAITING_FOR_PLAYER) {
            throw new IllegalStateException("Session is not waiting for players");
        }

        return connectPlayerUseCase.connect(session.getId(), playerId);
    }
}
