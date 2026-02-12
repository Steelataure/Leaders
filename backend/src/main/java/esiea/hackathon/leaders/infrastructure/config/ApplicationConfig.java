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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class ApplicationConfig implements WebMvcConfigurer {

    @Value("${app.allowed-origins}")
    private String[] allowedOrigins;

    @Override
    public void addCorsMappings(
            @org.springframework.lang.NonNull org.springframework.web.servlet.config.annotation.CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }

    @Bean
    public MatchmakingUseCase matchmakingUseCase(SessionRepository sessionRepository,
            CreateGameSessionUseCase createGameSessionUseCase, ConnectPlayerUseCase connectPlayerUseCase,
            GameSetupService gameSetupService,
            org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate) {
        return new MatchmakingUseCase(sessionRepository, createGameSessionUseCase, connectPlayerUseCase,
                gameSetupService, messagingTemplate);
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
