package esiea.hackathon.leaders.infrastructure.config;

import esiea.hackathon.leaders.domain.SessionRepository;
import esiea.hackathon.leaders.usecase.ConnectPlayerUseCase;
import esiea.hackathon.leaders.usecase.CreateGameSessionUseCase;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ApplicationConfig {

    @Bean
    public CreateGameSessionUseCase createGameSessionUseCase(SessionRepository sessionRepository) {
        return new CreateGameSessionUseCase(sessionRepository);
    }

    @Bean
    public ConnectPlayerUseCase connectPlayerUseCase(SessionRepository sessionRepository) {
        return new ConnectPlayerUseCase(sessionRepository);
    }
}
