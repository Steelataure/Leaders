package esiea.hackathon.leaders.infrastructure.config;

import esiea.hackathon.leaders.domain.SessionRepository;
import esiea.hackathon.leaders.usecase.ConnectPlayerUseCase;
import esiea.hackathon.leaders.usecase.CreateGameSessionUseCase;
import esiea.hackathon.leaders.usecase.MatchmakingUseCase;
import esiea.hackathon.leaders.usecase.JoinPrivateSessionUseCase;
import esiea.hackathon.leaders.application.services.GameSetupService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ApplicationConfig {

    @Bean
    public MatchmakingUseCase matchmakingUseCase(SessionRepository sessionRepository,
            CreateGameSessionUseCase createGameSessionUseCase, ConnectPlayerUseCase connectPlayerUseCase,
            GameSetupService gameSetupService) {
        return new MatchmakingUseCase(sessionRepository, createGameSessionUseCase, connectPlayerUseCase,
                gameSetupService);
    }

    @Bean
    public JoinPrivateSessionUseCase joinPrivateSessionUseCase(SessionRepository sessionRepository,
            ConnectPlayerUseCase connectPlayerUseCase) {
        return new JoinPrivateSessionUseCase(sessionRepository, connectPlayerUseCase);
    }

    @Bean
    public CreateGameSessionUseCase createGameSessionUseCase(SessionRepository sessionRepository) {
        return new CreateGameSessionUseCase(sessionRepository);
    }

    @Bean
    public ConnectPlayerUseCase connectPlayerUseCase(SessionRepository sessionRepository,
            GameSetupService gameSetupService) {
        return new ConnectPlayerUseCase(sessionRepository, gameSetupService);
    }
}
