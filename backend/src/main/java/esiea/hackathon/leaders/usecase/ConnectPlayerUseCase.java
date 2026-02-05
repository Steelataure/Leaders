package esiea.hackathon.leaders.usecase;

import esiea.hackathon.leaders.domain.Player;
import esiea.hackathon.leaders.domain.Session;
import esiea.hackathon.leaders.domain.SessionRepository;
import java.util.UUID;
import java.util.Optional;

public class ConnectPlayerUseCase {
    private final SessionRepository sessionRepository;
    private final esiea.hackathon.leaders.application.services.GameSetupService gameSetupService;

    public ConnectPlayerUseCase(SessionRepository sessionRepository,
            esiea.hackathon.leaders.application.services.GameSetupService gameSetupService) {
        this.sessionRepository = sessionRepository;
        this.gameSetupService = gameSetupService;
    }

    public Session connect(String sessionId, String playerId) {
        Optional<Session> sessionOpt = sessionRepository.findById(sessionId);

        if (sessionOpt.isEmpty()) {
            throw new IllegalArgumentException("Session not found: " + sessionId);
        }

        Session session = sessionOpt.get();
        // Use provided playerId or generate new one
        String actualPlayerId = (playerId != null) ? playerId : UUID.randomUUID().toString();
        Player player2 = new Player(actualPlayerId);

        session.join(player2);
        sessionRepository.save(session);

        System.out.println("DEBUG: Session status after join: " + session.getStatus());
        if (session.getStatus() == Session.SessionStatus.ACTIVE) {
            System.out.println("DEBUG: Creating game with ID: " + session.getId());
            gameSetupService.createGameWithId(UUID.fromString(session.getId()), null);
            System.out.println("DEBUG: Game created successfully!");
        } else {
            System.out.println("DEBUG: Session not ACTIVE, status is: " + session.getStatus());
        }

        return session;
    }
}
