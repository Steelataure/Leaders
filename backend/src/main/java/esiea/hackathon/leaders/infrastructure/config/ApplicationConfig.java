package esiea.hackathon.leaders.infrastructure.config;

import esiea.hackathon.leaders.domain.SessionRepository;
import esiea.hackathon.leaders.usecase.ConnectPlayerUseCase;
import esiea.hackathon.leaders.usecase.CreateGameSessionUseCase;
import esiea.hackathon.leaders.usecase.MatchmakingUseCase;
import esiea.hackathon.leaders.usecase.JoinPrivateSessionUseCase;
import esiea.hackathon.leaders.usecase.LeaveSessionUseCase;
import esiea.hackathon.leaders.usecase.HeartbeatUseCase;
import esiea.hackathon.leaders.usecase.StatsUseCase;
import esiea.hackathon.leaders.application.services.GameSetupService;
import esiea.hackathon.leaders.adapter.infrastructure.repository.SpringGamePlayerRepository;
import esiea.hackathon.leaders.adapter.infrastructure.repository.SpringGameRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class ApplicationConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:5173", "http://localhost:5174", "http://localhost:5175",
                        "http://localhost:3000") // Explicit origins to fix
                // IllegalArgumentException
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }

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
            GameSetupService gameSetupService,
            esiea.hackathon.leaders.application.services.GameQueryService gameQueryService,
            org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate,
            SpringGamePlayerRepository gamePlayerRepository,
            SpringGameRepository springGameRepository) {
        return new ConnectPlayerUseCase(sessionRepository, gameSetupService, gameQueryService, messagingTemplate,
                gamePlayerRepository, springGameRepository);
    }

    @Bean
    public LeaveSessionUseCase leaveSessionUseCase(SessionRepository sessionRepository,
            esiea.hackathon.leaders.domain.repository.GameRepository gameRepository,
            esiea.hackathon.leaders.application.services.GameService gameService) {
        return new LeaveSessionUseCase(sessionRepository, gameRepository, gameService);
    }

    @Bean
    public HeartbeatUseCase heartbeatUseCase(SessionRepository sessionRepository) {
        return new HeartbeatUseCase(sessionRepository);
    }

    @Bean
    public StatsUseCase statsUseCase(SessionRepository sessionRepository) {
        return new StatsUseCase(sessionRepository);
    }
}
