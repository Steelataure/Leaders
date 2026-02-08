package esiea.hackathon.leaders.application.services;

import esiea.hackathon.leaders.application.dto.response.CardDto;
import esiea.hackathon.leaders.application.dto.response.GameStateDto;
import esiea.hackathon.leaders.application.dto.response.PieceDto;
import esiea.hackathon.leaders.application.dto.response.PlayerDto;
import esiea.hackathon.leaders.domain.model.GameEntity;
import esiea.hackathon.leaders.domain.model.enums.CardState;
import esiea.hackathon.leaders.domain.repository.GameRepository;
import esiea.hackathon.leaders.domain.repository.PieceRepository;
import esiea.hackathon.leaders.domain.repository.RecruitmentCardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GameQueryService {

        private final GameRepository gameRepository;
        private final PieceRepository pieceRepository;
        private final RecruitmentCardRepository cardRepository;

        @Transactional(readOnly = true)
        public GameStateDto getGameState(UUID gameId) {
                System.out.println("DEBUG: Fetching game state for ID: " + gameId);
                // 1. Jeu
                GameEntity game = gameRepository.findById(gameId)
                                .orElseThrow(() -> {
                                        System.out.println("ERROR: Game not found in DB for ID: " + gameId);
                                        return new esiea.hackathon.leaders.infrastructure.exception.GameNotFoundException(
                                                        "Game not found with ID: " + gameId);
                                });

                // 2. Pièces
                List<PieceDto> pieces = pieceRepository.findByGameId(gameId).stream()
                                .map(p -> new PieceDto(
                                                p.getId(),
                                                p.getCharacterId(),
                                                p.getOwnerIndex().intValue(),
                                                p.getQ(),
                                                p.getR(),
                                                p.getHasActedThisTurn()))
                                .toList();

                // 3. Rivière
                List<CardDto> river = cardRepository.findAllByGameId(gameId).stream()
                                .filter(c -> c.getState() == CardState.VISIBLE)
                                .map(c -> new CardDto(
                                                c.getId(),
                                                c.getCharacter().getId(),
                                                c.getState(),
                                                c.getVisibleSlot()))
                                .toList();

                // 4. Joueurs
                List<PlayerDto> players = game.getPlayers() != null
                                ? game.getPlayers().stream()
                                                .map(p -> new PlayerDto(p.getUserId(), p.getPlayerIndex()))
                                                .toList()
                                : List.of();

                // 5. DTO final
                return new GameStateDto(
                                game.getId(),
                                game.getStatus(),
                                game.getPhase(),
                                game.getCurrentPlayerIndex(),
                                game.getTurnNumber(),
                                game.isHasRecruitedThisTurn(),
                                game.getWinnerPlayerIndex(),
                                game.getWinnerVictoryType(),
                                pieces,
                                river,
                                players);
        }
}