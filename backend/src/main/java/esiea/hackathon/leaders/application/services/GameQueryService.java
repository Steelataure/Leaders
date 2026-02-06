package esiea.hackathon.leaders.application.services;

import esiea.hackathon.leaders.application.dto.response.CardDto;
import esiea.hackathon.leaders.application.dto.response.GameStateDto;
import esiea.hackathon.leaders.application.dto.response.PieceDto;
import esiea.hackathon.leaders.domain.model.GameEntity;
import esiea.hackathon.leaders.domain.model.enums.CardState;
import esiea.hackathon.leaders.domain.repository.GameRepository;
import esiea.hackathon.leaders.domain.repository.PieceRepository;
import esiea.hackathon.leaders.domain.repository.RecruitmentCardRepository;
import lombok.RequiredArgsConstructor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GameQueryService {

    private static final Logger LOGGER = LogManager.getLogger(GameQueryService.class);

    private final GameRepository gameRepository;
    private final PieceRepository pieceRepository;
    private final RecruitmentCardRepository cardRepository;

    @Transactional(readOnly = true)
    public GameStateDto getGameState(UUID gameId) {
        LOGGER.info("Récupération de l'état du jeu pour l'ID : {}", gameId);

        // 1. Jeu
        GameEntity game = gameRepository.findById(gameId)
                .orElseThrow(() -> {
                    LOGGER.error("Échec de la récupération : Jeu introuvable avec l'ID {}", gameId);
                    return new IllegalArgumentException("Game not found");
                });

        LOGGER.debug("Jeu trouvé. Phase actuelle : {}, Tour : {}", game.getPhase(), game.getTurnNumber());

        // 2. Pièces
        List<PieceDto> pieces = pieceRepository.findByGameId(gameId).stream()
                .map(p -> new PieceDto(
                        p.getId(),
                        p.getCharacterId(),
                        p.getOwnerIndex().intValue(),
                        p.getQ(),
                        p.getR(),
                        p.getHasActedThisTurn()
                ))
                .toList();
        
        LOGGER.debug("{} pièces récupérées pour la partie.", pieces.size());

        // 3. Rivière
        List<CardDto> river = cardRepository.findAllByGameId(gameId).stream()
                .filter(c -> c.getState() == CardState.VISIBLE)
                .map(c -> new CardDto(
                        c.getId(),
                        c.getCharacter().getId(),
                        c.getState(),
                        c.getVisibleSlot()
                ))
                .toList();

        LOGGER.debug("{} cartes visibles dans la rivière.", river.size());

        // 4. DTO final
        LOGGER.info("État du jeu construit avec succès pour l'ID : {}", gameId);
        
        return new GameStateDto(
                game.getId(),
                game.getStatus(),
                game.getPhase(),
                game.getCurrentPlayerIndex(),
                game.getTurnNumber(),
                game.getWinnerPlayerIndex(),
                game.getWinnerVictoryType(),
                pieces,
                river
        );
    }
}