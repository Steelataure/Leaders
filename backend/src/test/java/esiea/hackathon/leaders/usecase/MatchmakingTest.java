package esiea.hackathon.leaders.usecase;

import esiea.hackathon.leaders.domain.Session;
import esiea.hackathon.leaders.domain.SessionRepository;
import esiea.hackathon.leaders.infrastructure.repository.InMemorySessionRepository;
import esiea.hackathon.leaders.adapter.infrastructure.repository.SpringGamePlayerRepository; // Import ajouté
import esiea.hackathon.leaders.adapter.infrastructure.repository.SpringGameRepository; // Import ajouté
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

public class MatchmakingTest {

    private SessionRepository sessionRepository;
    private MatchmakingUseCase matchmakingUseCase;
    private CreateGameSessionUseCase createGameSessionUseCase;
    private ConnectPlayerUseCase connectPlayerUseCase;
    private esiea.hackathon.leaders.application.services.GameSetupService gameSetupService;

    @BeforeEach
    void setUp() {
        sessionRepository = new InMemorySessionRepository();
        createGameSessionUseCase = new CreateGameSessionUseCase(sessionRepository);
        gameSetupService = mock(esiea.hackathon.leaders.application.services.GameSetupService.class);

        // On mock les nouveaux repositories requis par le constructeur
        SpringGamePlayerRepository gamePlayerRepository = mock(SpringGamePlayerRepository.class);
        SpringGameRepository gameRepository = mock(SpringGameRepository.class);

        connectPlayerUseCase = new ConnectPlayerUseCase(
                sessionRepository,
                gameSetupService,
                mock(esiea.hackathon.leaders.application.services.GameQueryService.class),
                mock(org.springframework.messaging.simp.SimpMessagingTemplate.class),
                gamePlayerRepository, // Nouvel argument
                gameRepository // Nouvel argument
        );

        matchmakingUseCase = new MatchmakingUseCase(sessionRepository, createGameSessionUseCase, connectPlayerUseCase,
                gameSetupService);
    }

    @Test
    void testMatchmaking() {
        String p1 = "player-1";
        String p2 = "player-2";

        // 1. Player 1 searches
        Session s1 = matchmakingUseCase.findOrCreatePublicSession(p1);
        assertNotNull(s1);
        assertEquals(Session.SessionStatus.WAITING_FOR_PLAYER, s1.getStatus());
        assertEquals(p1, s1.getPlayer1().getId());

        // 2. Player 2 searches
        Session s2 = matchmakingUseCase.findOrCreatePublicSession(p2);
        assertNotNull(s2);

        // 3. Should match
        assertEquals(s1.getId(), s2.getId());
        assertEquals(Session.SessionStatus.ACTIVE, s2.getStatus());
    }

    @Test
    void testSelfMatchmaking() {
        String p1 = "player-1";

        // 1. Player 1 searches
        Session s1 = matchmakingUseCase.findOrCreatePublicSession(p1);

        // 2. Player 1 searches again (should return same session)
        Session s2 = matchmakingUseCase.findOrCreatePublicSession(p1);

        assertEquals(s1.getId(), s2.getId());
        assertEquals(Session.SessionStatus.WAITING_FOR_PLAYER, s2.getStatus());
    }
}