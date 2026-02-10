package esiea.hackathon.leaders.application.services;

import esiea.hackathon.leaders.domain.model.AbilityEntity;
import esiea.hackathon.leaders.domain.model.GameEntity;
import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import esiea.hackathon.leaders.domain.model.RecruitmentCardEntity;
import esiea.hackathon.leaders.domain.model.RefCharacterEntity;
import esiea.hackathon.leaders.domain.model.enums.CardState;
import esiea.hackathon.leaders.domain.repository.GameRepository;
import esiea.hackathon.leaders.domain.repository.PieceRepository;
import esiea.hackathon.leaders.domain.repository.RecruitmentCardRepository;
import esiea.hackathon.leaders.domain.repository.RefCharacterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AiService {

    private final GameRepository gameRepository;
    private final PieceRepository pieceRepository;
    private final MovementService movementService;
    private final GameService gameService;
    private final GameQueryService gameQueryService;
    private final ActionService actionService;
    private final RecruitmentService recruitmentService;
    private final RecruitmentCardRepository cardRepository;
    private final RefCharacterRepository characterRepository;
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    @org.springframework.context.annotation.Lazy
    @org.springframework.beans.factory.annotation.Autowired
    private AiService self;

    // Fixed UUID for the AI Player
    public static final UUID AI_PLAYER_ID = UUID.fromString("00000000-0000-0000-0000-000000000000");

    private void log(String message) {
        try {
            java.nio.file.Files.write(java.nio.file.Paths.get("ai_debug.log"),
                    (java.time.LocalDateTime.now() + ": " + message + "\n").getBytes(),
                    java.nio.file.StandardOpenOption.CREATE, java.nio.file.StandardOpenOption.APPEND);
            System.out.println(message);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Async
    public void playTurn(UUID gameId) {
        try {
            System.out.println("AI IS THINKING for game: " + gameId);
            Thread.sleep(1000);

            // 1. Actions Loop (Move / Attack)
            int actionCount = 0;
            while (actionCount < 10) { // Safety break
                boolean actionTaken = self.performNextAction(gameId);
                if (!actionTaken) {
                    break;
                }
                actionCount++;
                Thread.sleep(800); // Animation delay
            }

            // 2. Recruitment
            int recruitAttempts = 0;
            while (recruitAttempts < 2) { // Try up to 2 times
                boolean recruited = self.performRecruitment(gameId);
                if (!recruited) {
                    break;
                }
                recruitAttempts++;
                Thread.sleep(800);
            }

            // 3. End Turn
            self.endAiTurn(gameId);

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } catch (Exception e) {
            System.err.println("AI Critical Error: " + e.getMessage());
            e.printStackTrace();
            // Try to force end turn to avoid blocking game
            try {
                gameService.endTurn(gameId);
            } catch (Exception ex) {
                /* ignored */ }
        }
    }

    @Transactional
    public boolean performNextAction(UUID gameId) {
        GameEntity game = gameRepository.findById(gameId).orElse(null);
        if (validateGame(game) == false)
            return false;

        List<PieceEntity> allPieces = pieceRepository.findByGameId(gameId);
        List<PieceEntity> myPieces = allPieces.stream()
                .filter(p -> p.getOwnerIndex() == 1 && !p.getHasActedThisTurn())
                .collect(Collectors.toList());
        List<PieceEntity> enemyPieces = allPieces.stream()
                .filter(p -> p.getOwnerIndex() == 0)
                .collect(Collectors.toList());

        if (myPieces.isEmpty()) {
            return false;
        }

        // HEURISTICS
        Move bestMove = null;
        double bestScore = -Double.MAX_VALUE;
        boolean isAbility = false;
        String abilityIdToUse = null;
        PieceEntity targetToAbility = null;

        for (PieceEntity piece : myPieces) {
            // A. Check Moves
            try {
                List<HexCoord> validMoves = movementService.getValidMovesForPiece(piece.getId());
                for (HexCoord dest : validMoves) {
                    double score = evaluateMove(piece, dest, allPieces, enemyPieces);
                    score += (new Random().nextDouble() * 0.5); // Randomness
                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = new Move(piece, dest);
                        isAbility = false;
                    }
                }
            } catch (Exception e) {
            }

            // B. Check Abilities (Simplified: Only Attack for now)
            // TODO: Add complex ability check (Heal, etc.)
        }

        if (bestMove != null) {
            System.out.println("AI ACTION: Moving " + bestMove.piece.getCharacterId());
            movementService.movePiece(bestMove.piece.getId(), bestMove.dest.q(), bestMove.dest.r(), AI_PLAYER_ID);
            notifyUpdate(gameId);
            return true;
        }

        // If no valid moves logic found (should rarely happen if list not empty), mark
        // as acted to prevent infinite loop
        if (!myPieces.isEmpty()) {
            PieceEntity p = myPieces.get(0);
            p.setHasActedThisTurn(true);
            pieceRepository.save(p);
            return true;
        }

        return false;
    }

    @Transactional
    public boolean performRecruitment(UUID gameId) {
        GameEntity game = gameRepository.findById(gameId).orElse(null);
        if (validateGame(game) == false)
            return false;

        // Determine Max Recruitment
        int maxRecruitment = 1;
        // P1 starts at Turn 2. The rule allows 2 recruits on their first turn.
        if (game.getCurrentPlayerIndex() == 1 && game.getTurnNumber() <= 2) {
            maxRecruitment = 2;
        }

        // Check if can recruit
        if (game.getRecruitmentCount() >= maxRecruitment) {
            return false;
        }

        // Check cards
        List<RecruitmentCardEntity> visibleCards = cardRepository.findAllByGameId(gameId).stream()
                .filter(c -> c.getState() == CardState.VISIBLE)
                .collect(Collectors.toList());

        if (visibleCards.isEmpty()) {
            log("DEBUG: AI cannot recruit (No visible cards)");
            return false;
        }

        // Pick random card or logic
        RecruitmentCardEntity cardToBuy = visibleCards.get(new Random().nextInt(visibleCards.size()));

        // Check if max units reached
        long myUnitCount = pieceRepository.findByGameId(gameId).stream().filter(p -> p.getOwnerIndex() == 1).count();
        if (myUnitCount >= 5) {
            log("DEBUG: AI cannot recruit (Max units reached: " + myUnitCount + ")");
            return false;
        }

        // Find placement logic (Edge hexes for Player 1: r=-3 or q+r=-3)
        List<HexCoord> validPlacements = findValidPlacement(gameId);

        if (validPlacements.isEmpty()) {
            log("DEBUG: AI cannot recruit (No valid placement spots)");
            return false;
        }

        // Perform Recruitment
        log("AI Recruiting: " + cardToBuy.getCharacter().getId() + " at "
                + validPlacements.get(0).q() + "," + validPlacements.get(0).r());
        try {
            recruitmentService.recruit(gameId, (short) 1, cardToBuy.getId(),
                    Collections.singletonList(validPlacements.get(0)));
            notifyUpdate(gameId);
            return true;
        } catch (Exception e) {
            log("AI Recruitment failed: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    @Transactional
    public void endAiTurn(UUID gameId) {
        GameEntity game = gameRepository.findById(gameId).orElse(null);
        if (validateGame(game)) {
            gameService.endTurn(gameId);
            notifyUpdate(gameId);
        }
    }

    // --- Helpers ---

    private boolean validateGame(GameEntity game) {
        return game != null && game.getStatus() == esiea.hackathon.leaders.domain.model.enums.GameStatus.IN_PROGRESS
                && game.getCurrentPlayerIndex() == 1;
    }

    private List<HexCoord> findValidPlacement(UUID gameId) {
        // Player 1 spawn zone: r=-3 or q+r=-3
        // q in [-3, 3]
        List<HexCoord> candidates = new ArrayList<>();
        // Edge 1: r = -3
        for (int q = 0; q <= 3; q++) {
            candidates.add(new HexCoord((short) q, (short) -3));
        }
        // Edge 2: q+r = -3 => r = -3 - q
        for (int q = -3; q <= 0; q++) {
            candidates.add(new HexCoord((short) q, (short) (-3 - q)));
        }

        // Shuffle and find empty
        Collections.shuffle(candidates);
        List<PieceEntity> allPieces = pieceRepository.findByGameId(gameId);

        return candidates.stream()
                .filter(c -> allPieces.stream().noneMatch(p -> p.getQ() == c.q() && p.getR() == c.r()))
                .collect(Collectors.toList());
    }

    private void notifyUpdate(UUID gameId) {
        try {
            esiea.hackathon.leaders.application.dto.response.GameStateDto state = gameQueryService.getGameState(gameId);
            messagingTemplate.convertAndSend("/topic/game/" + gameId, state);
        } catch (Exception e) {
            log("Failed to notify Update from AI: " + e.getMessage());
        }
    }

    private double evaluateMove(PieceEntity piece, HexCoord dest, List<PieceEntity> allPieces,
            List<PieceEntity> enemyPieces) {
        double score = 0;

        // 1. OFFENSIVE : Capture
        PieceEntity target = enemyPieces.stream()
                .filter(e -> e.getQ() == dest.q() && e.getR() == dest.r())
                .findFirst().orElse(null);

        if (target != null) {
            if ("LEADER".equals(target.getCharacterId())) {
                score += 1000;
            } else {
                score += 10;
            }
        }

        // 2. STRATEGIC : Approach enemy leader
        PieceEntity enemyLeader = enemyPieces.stream()
                .filter(e -> "LEADER".equals(e.getCharacterId()))
                .findFirst().orElse(null);

        if (enemyLeader != null) {
            int distBefore = distance(piece.getQ(), piece.getR(), enemyLeader.getQ(), enemyLeader.getR());
            int distAfter = distance(dest.q(), dest.r(), enemyLeader.getQ(), enemyLeader.getR());
            if (distAfter < distBefore)
                score += 2;
        }

        // 3. DEFENSIVE : Protect own leader
        PieceEntity myLeader = allPieces.stream()
                .filter(p -> "LEADER".equals(p.getCharacterId()) && p.getOwnerIndex() == 1)
                .findFirst().orElse(null);
        if (myLeader != null) {
            int distToLeader = distance(dest.q(), dest.r(), myLeader.getQ(), myLeader.getR());
            if (distToLeader == 1)
                score += 1; // Stay close
        }

        // 4. SAFETY
        long enemiesNearby = enemyPieces.stream()
                .filter(e -> distance(dest.q(), dest.r(), e.getQ(), e.getR()) == 1)
                .count();
        if (enemiesNearby > 0)
            score -= (enemiesNearby * 1.5);

        return score;
    }

    private int distance(int q1, int r1, int q2, int r2) {
        return (Math.abs(q1 - q2) + Math.abs(q1 + r1 - q2 - r2) + Math.abs(r1 - r2)) / 2;
    }

    private record Move(PieceEntity piece, HexCoord dest) {
    }
}
