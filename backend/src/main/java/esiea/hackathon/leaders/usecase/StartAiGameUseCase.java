package esiea.hackathon.leaders.usecase;

import esiea.hackathon.leaders.adapter.infrastructure.entity.GameJpaEntity;
import esiea.hackathon.leaders.adapter.infrastructure.entity.GamePlayerJpaEntity;
import esiea.hackathon.leaders.adapter.infrastructure.repository.SpringGamePlayerRepository;
import esiea.hackathon.leaders.adapter.infrastructure.repository.SpringGameRepository;
import esiea.hackathon.leaders.application.services.AiService;
import esiea.hackathon.leaders.application.services.GameSetupService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class StartAiGameUseCase {

        private final GameSetupService gameSetupService;
        private final SpringGamePlayerRepository gamePlayerRepository;
        private final SpringGameRepository springGameRepository;

        @Transactional
        public UUID startAiGame(UUID humanPlayerId,
                        esiea.hackathon.leaders.domain.model.enums.AiDifficulty difficulty) {
                // 1. Create Game Logic (Board, Pieces, Deck)
                UUID gameId = UUID.randomUUID();
                gameSetupService.createGameWithId(gameId, null);

                // 2. Fetch Infrastructure Entity (GameJpaEntity) to link players
                GameJpaEntity gameRef = springGameRepository.findById(gameId)
                                .orElseThrow(() -> new RuntimeException("Game not found after creation: " + gameId));

                // Ensure players list is initialized
                if (gameRef.getPlayers() == null) {
                        gameRef.setPlayers(new java.util.ArrayList<>());
                }

                // 3. Create Human Player (Index 0)
                GamePlayerJpaEntity humanPlayer = GamePlayerJpaEntity.builder()
                                .game(gameRef)
                                .userId(humanPlayerId)
                                .playerIndex(0)
                                .isFirstTurnCompleted(false)
                                .build();
                gamePlayerRepository.save(humanPlayer);
                gameRef.getPlayers().add(humanPlayer);

                // 4. Create AI Player (Index 1)
                GamePlayerJpaEntity aiPlayer = GamePlayerJpaEntity.builder()
                                .game(gameRef)
                                .userId(AiService.AI_PLAYER_ID)
                                .playerIndex(1)
                                .isFirstTurnCompleted(false)
                                .build();
                gamePlayerRepository.save(aiPlayer);
                gameRef.getPlayers().add(aiPlayer);

                System.out.println("DEBUG: AI Game started! GameID=" + gameId + ", Human=" + humanPlayerId + ", AI="
                                + AiService.AI_PLAYER_ID);

                return gameId;
        }
}
