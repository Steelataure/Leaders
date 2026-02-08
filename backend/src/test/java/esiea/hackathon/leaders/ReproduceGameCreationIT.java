package esiea.hackathon.leaders;

import esiea.hackathon.leaders.domain.Session;
import esiea.hackathon.leaders.domain.SessionRepository;
import esiea.hackathon.leaders.usecase.ConnectPlayerUseCase;
import esiea.hackathon.leaders.usecase.CreateGameSessionUseCase;
import esiea.hackathon.leaders.application.services.GameQueryService;
import esiea.hackathon.leaders.infrastructure.exception.GameNotFoundException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

@SpringBootTest
@ActiveProfiles("test")
class ReproduceGameCreationIT {

    @Autowired
    private CreateGameSessionUseCase createGameSessionUseCase;

    @Autowired
    private ConnectPlayerUseCase connectPlayerUseCase;

    @Autowired
    private GameQueryService gameQueryService;

    @Autowired
    private SessionRepository sessionRepository;

    @Test
    void reproduce_gameCreationFlow() {
        // 1. Create a Session
        Session session = createGameSessionUseCase.createSession(false, "Player1");
        String sessionId = session.getId();
        System.out.println("TEST: Session Created with ID: " + sessionId);

        // 2. Connect Player 2 -> Should Trigger Game Creation
        System.out.println("TEST: Connecting Player 2...");
        connectPlayerUseCase.connect(sessionId, "Player2");

        // 3. Verify Session Status
        Session updatedSession = sessionRepository.findById(sessionId).orElseThrow();
        assertThat(updatedSession.getStatus()).isEqualTo(Session.SessionStatus.ACTIVE);
        System.out.println("TEST: Session is ACTIVE");

        // 4. Try to fetch the Game (This is where GameNotFoundException happens)
        System.out.println("TEST: Fetching Game State...");
        UUID gameId = UUID.fromString(sessionId);

        assertDoesNotThrow(() -> gameQueryService.getGameState(gameId),
                "Should find the game created with the same ID as the session");

        System.out.println("TEST: Game fetched successfully!");
    }
}
