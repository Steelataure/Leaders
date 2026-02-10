package esiea.hackathon.leaders.application.services;

import esiea.hackathon.leaders.domain.model.GameEntity;
import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import esiea.hackathon.leaders.domain.model.RecruitmentCardEntity;
import esiea.hackathon.leaders.domain.model.enums.CardState;
import esiea.hackathon.leaders.domain.repository.GameRepository;
import esiea.hackathon.leaders.domain.repository.PieceRepository;
import esiea.hackathon.leaders.domain.repository.RecruitmentCardRepository;
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
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;
    private final AiSimulationService aiSimulationService;

    @org.springframework.context.annotation.Lazy
    @org.springframework.beans.factory.annotation.Autowired
    private AiService self;

    // ... (rest of fields)

    // ...

    private double evaluateMoveHard(PieceEntity piece, HexCoord dest, List<PieceEntity> allPieces,
            List<PieceEntity> enemyPieces) {
        double score = 0;

        // 1. MATERIAL & KILL INSTINCT
        PieceEntity target = enemyPieces.stream()
                .filter(e -> e.getQ() == dest.q() && e.getR() == dest.r())
                .findFirst().orElse(null);

        if (target != null) {
            if ("LEADER".equals(target.getCharacterId()))
                return 1000000.0; // CHECKMATE ! HUGE SCORE (1M)
            score += 150.0; // Kill unit (Was 100) -> Encourage trading
        }

        // 1b. PASSIVE INSTANT WIN CHECKS (New)
        PieceEntity enemyLeader = enemyPieces.stream()
                .filter(e -> "LEADER".equals(e.getCharacterId()))
                .findFirst().orElse(null);

        if (enemyLeader != null) {
            int distToEnemyLeader = distance(dest.q(), dest.r(), enemyLeader.getQ(), enemyLeader.getR());

            // ASSASSIN: If I am Assassin and I move adjacent to Leader -> I WIN
            if ("ASSASSIN".equals(piece.getCharacterId()) && distToEnemyLeader == 1) {
                return 1000000.0;
            }

            // ARCHER: If I am Archer and I move to range 2 (Line) -> High Pressure (Almost
            // Win if supported)
            if ("ARCHER".equals(piece.getCharacterId()) && distToEnemyLeader == 2
                    && isInLoS(piece, enemyLeader.getQ(), enemyLeader.getR())) { // Note: isInLoS uses piece Q/R, we
                                                                                 // need dest Q/R
                // Wait, isInLoS takes PieceEntity p1. We need to check LoS from DEST.
                if (isInLoSCoords(dest.q(), dest.r(), enemyLeader.getQ(), enemyLeader.getR())) {
                    score += 500.0; // Massive pressure
                }
            }
        }

        // 2. SAFETY (Deep Simulation)
        // Check if this move leads to death (Minimax-lite)
        if (aiSimulationService != null) {
            double riskScore = aiSimulationService.evaluateFutureRisk(allPieces, piece, dest);
            // Risk is negative.
            // If risk is -100 (Lose Unit) and Score is +150 (Kill Unit) -> Net +50 -> TAKES
            // THE TRADE.
            // If risk is -1M (Lose Leader) -> Net Huge Negative -> AVOID.
            score += riskScore;
        }

        // 3. POSITIONAL
        // Control center
        int distToCenter = distance(dest.q(), dest.r(), 0, 0);
        score -= (distToCenter * 2.0);

        // Aggression towards enemy leader
        if (enemyLeader != null) {
            int distError = distance(dest.q(), dest.r(), enemyLeader.getQ(), enemyLeader.getR());
            score -= (distError * 8.0); // Closer is better (Was 5.0)
        }

        // 4. PROTECTION
        // If I am NOT leader, am I shielding my leader?
        if (!"LEADER".equals(piece.getCharacterId())) {
            PieceEntity myLeader = allPieces.stream()
                    .filter(p -> "LEADER".equals(p.getCharacterId()) && p.getOwnerIndex() == 1)
                    .findFirst().orElse(null);
            if (myLeader != null) {
                int distToLeader = distance(dest.q(), dest.r(), myLeader.getQ(), myLeader.getR());
                if (distToLeader == 1)
                    score += 20.0; // Guarding
            }
        }

        return score;
    }

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

        esiea.hackathon.leaders.domain.model.enums.AiDifficulty difficulty = game.getAiDifficulty();
        if (difficulty == null)
            difficulty = esiea.hackathon.leaders.domain.model.enums.AiDifficulty.EASY;

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

        for (PieceEntity piece : myPieces) {
            // A. Check Moves
            try {
                List<HexCoord> validMoves = movementService.getValidMovesForPiece(piece.getId());
                for (HexCoord dest : validMoves) {
                    double score;
                    if (difficulty == esiea.hackathon.leaders.domain.model.enums.AiDifficulty.HARD) {
                        score = evaluateMoveHard(piece, dest, allPieces, enemyPieces);
                    } else {
                        score = evaluateMove(piece, dest, allPieces, enemyPieces);
                        score += (new Random().nextDouble() * 0.5); // Randomness for Easy
                    }

                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = new Move(piece, dest, null, null, null);
                    }
                }
            } catch (Exception e) {
            }

            // B. Check Abilities
            try {
                // ILLUSIONIST: Swap
                if ("ILLUSIONIST".equals(piece.getCharacterId())) {
                    for (PieceEntity enemy : enemyPieces) {
                        if (isInLoS(piece, enemy)
                                && distance(piece.getQ(), piece.getR(), enemy.getQ(), enemy.getR()) > 1
                                && esiea.hackathon.leaders.domain.utils.HexUtils.isPathClear(
                                        new HexCoord(piece.getQ(), piece.getR()),
                                        new HexCoord(enemy.getQ(), enemy.getR()),
                                        allPieces)) {
                            double score = 40.0; // Base: Better than simple move
                            if ("LEADER".equals(enemy.getCharacterId()))
                                score += 2000.0; // Aggressive Swap

                            // If swapping puts enemy Leader in danger, boost more?
                            // (Simple heuristic: Swap is almost always good if it disrupts enemy)

                            if (score > bestScore) {
                                bestScore = score;
                                bestMove = new Move(piece, new HexCoord((short) enemy.getQ(), (short) enemy.getR()),
                                        "ILLUSIONIST_SWAP", enemy.getId(), null);
                            }
                        }
                    }
                }

                // INNKEEPER: Assist allies
                if ("INNKEEPER".equals(piece.getCharacterId())) {
                    List<PieceEntity> allies = allPieces.stream()
                            .filter(p -> p.getOwnerIndex() == 1 && !p.getId().equals(piece.getId()))
                            .collect(Collectors.toList());
                    for (PieceEntity ally : allies) {
                        if (distance(piece.getQ(), piece.getR(), ally.getQ(), ally.getR()) == 1) {
                            for (HexCoord d : getAdjacentCoords(ally.getQ(), ally.getR())) {
                                if (isCellEmpty(d, allPieces)) {
                                    double score = 15.0; // Nice utility
                                    if (score > bestScore) {
                                        bestScore = score;
                                        bestMove = new Move(piece, d, "INNKEEPER_ASSIST", ally.getId(), d);
                                    }
                                }
                            }
                        }
                    }
                }

                // PROWLER: Stealth
                if ("PROWLER".equals(piece.getCharacterId())) {
                    PieceEntity leader = enemyPieces.stream().filter(e -> "LEADER".equals(e.getCharacterId()))
                            .findFirst().orElse(null);
                    if (leader != null) {
                        for (int q = -3; q <= 3; q++) {
                            for (int r = -3; r <= 3; r++) {
                                if (Math.abs(q + r) <= 3) {
                                    HexCoord d = new HexCoord((short) q, (short) r);
                                    if (isCellEmpty(d, allPieces)) {
                                        // Prowler stealth to Range 2 of Leader = High Pressure
                                        boolean isSafe = enemyPieces.stream()
                                                .noneMatch(e -> distance(d.q(), d.r(), e.getQ(), e.getR()) == 1);
                                        if (isSafe) {
                                            int distToLeader = distance(d.q(), d.r(), leader.getQ(), leader.getR());
                                            if (distToLeader <= 2) {
                                                double score = 50.0; // High threat positioning
                                                if (score > bestScore) {
                                                    bestScore = score;
                                                    bestMove = new Move(piece, d, "PROWLER_STEALTH", null, d);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // GRAPPLER: Hook
                if ("GRAPPLER".equals(piece.getCharacterId())) {
                    for (PieceEntity enemy : enemyPieces) {
                        int dist = distance(piece.getQ(), piece.getR(), enemy.getQ(), enemy.getR());
                        if (dist > 1 && isInLoS(piece, enemy)
                                && esiea.hackathon.leaders.domain.utils.HexUtils.isPathClear(
                                        new HexCoord(piece.getQ(), piece.getR()),
                                        new HexCoord(enemy.getQ(), enemy.getR()),
                                        allPieces)) {
                            double pullScore = 45.0; // Strong control
                            if ("LEADER".equals(enemy.getCharacterId()))
                                pullScore += 2000.0; // Aggressive Hook

                            int dq = enemy.getQ() - piece.getQ();
                            int dr = enemy.getR() - piece.getR();
                            int dirQ = dq / dist;
                            int dirR = dr / dist;
                            HexCoord pullDest = new HexCoord((short) (piece.getQ() + dirQ),
                                    (short) (piece.getR() + dirR));
                            if (isCellEmpty(pullDest, allPieces)) {
                                if (pullScore > bestScore) {
                                    bestScore = pullScore;
                                    bestMove = new Move(piece, new HexCoord((short) enemy.getQ(), (short) enemy.getR()),
                                            "GRAPPLE_HOOK", enemy.getId(), null);
                                }
                            }
                        }
                    }
                }

                // BRAWLER: Push
                if ("BRAWLER".equals(piece.getCharacterId())) {
                    for (PieceEntity enemy : enemyPieces) {
                        if (distance(piece.getQ(), piece.getR(), enemy.getQ(), enemy.getR()) == 1) {
                            int dirQ = enemy.getQ() - piece.getQ();
                            int dirR = enemy.getR() - piece.getR();
                            HexCoord pushDest = new HexCoord((short) (enemy.getQ() + dirQ),
                                    (short) (enemy.getR() + dirR));
                            if (pushDest.isValid() && isCellEmpty(pushDest, allPieces)) {
                                double score = 30.0;
                                if ("LEADER".equals(enemy.getCharacterId()))
                                    score += 2000.0; // Aggressive Push
                                if (score > bestScore) {
                                    bestScore = score;
                                    bestMove = new Move(piece, new HexCoord((short) enemy.getQ(), (short) enemy.getR()),
                                            "BRAWLER_PUSH", enemy.getId(), pushDest);
                                }
                            }
                        }
                    }
                }
            } catch (Exception e) {
            }
        }

        if (bestMove != null && bestMove.abilityId() != null) {
            log("AI ACTION: Using Ability " + bestMove.abilityId() + " with " + bestMove.piece().getCharacterId());
            actionService.useAbility(bestMove.piece().getId(), bestMove.targetId(), bestMove.abilityId(),
                    bestMove.abilityDest(), AI_PLAYER_ID);
            notifyUpdate(gameId);
            return true;
        }

        if (bestMove != null) {
            log("AI ACTION: Moving " + bestMove.piece().getCharacterId() + " to " + bestMove.dest().q() + ","
                    + bestMove.dest().r());
            movementService.movePiece(bestMove.piece().getId(), bestMove.dest().q(), bestMove.dest().r(), AI_PLAYER_ID);
            notifyUpdate(gameId);
            return true;
        }

        if (!myPieces.isEmpty()) {
            PieceEntity p = myPieces.get(0);
            p.setHasActedThisTurn(true);
            pieceRepository.save(p);
            return true;
        }

        return false;
    }

    private boolean isInLoS(PieceEntity p1, PieceEntity p2) {
        return p1.getQ() == p2.getQ() || p1.getR() == p2.getR() || (p1.getQ() + p1.getR() == p2.getQ() + p2.getR());
    }

    private List<HexCoord> getAdjacentCoords(short q, short r) {
        List<HexCoord> list = new ArrayList<>();
        list.add(new HexCoord((short) (q + 1), r));
        list.add(new HexCoord((short) (q - 1), r));
        list.add(new HexCoord(q, (short) (r + 1)));
        list.add(new HexCoord(q, (short) (r - 1)));
        list.add(new HexCoord((short) (q + 1), (short) (r - 1)));
        list.add(new HexCoord((short) (q - 1), (short) (r + 1)));
        return list;
    }

    private boolean isCellEmpty(HexCoord c, List<PieceEntity> pieces) {
        return pieces.stream().noneMatch(p -> p.getQ() == c.q() && p.getR() == c.r());
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
        try {
            List<HexCoord> placements = new ArrayList<>();
            placements.add(validPlacements.get(0));

            // Cas Spécial: OLD_BEAR nécessite 2 placements
            if ("OLD_BEAR".equals(cardToBuy.getCharacter().getId())) {
                if (validPlacements.size() >= 2) {
                    placements.add(validPlacements.get(1));
                } else {
                    log("DEBUG: AI cannot recruit OLD_BEAR (Not enough spawn cells)");
                    return false;
                }
            }

            log("AI Recruiting: " + cardToBuy.getCharacter().getId() + " at " + placements);
            recruitmentService.recruit(gameId, (short) 1, cardToBuy.getId(), placements);
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
                score += 2000; // Strong desire to win
            } else {
                score += 50;
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
                score += 5;
        }

        // 3. DEFENSIVE : Protect own leader
        PieceEntity myLeader = allPieces.stream()
                .filter(p -> "LEADER".equals(p.getCharacterId()) && p.getOwnerIndex() == 1)
                .findFirst().orElse(null);

        if (myLeader != null) {
            // A. Don't leave Leader alone
            int distToLeader = distance(dest.q(), dest.r(), myLeader.getQ(), myLeader.getR());
            if (distToLeader == 1) {
                score += 10; // Stay close as bodyguard
            }

            // B. Special check: If I AM THE LEADER, evaluate danger
            if ("LEADER".equals(piece.getCharacterId())) {
                // Penalty for being capturable by ANY enemy piece next turn
                for (PieceEntity enemy : enemyPieces) {
                    // This is approximate LoS/Distance based on common units
                    if (canPotentiallyCapture(enemy, dest.q(), dest.r(), allPieces)) {
                        score -= 500; // Extremely dangerous
                        log("DEBUG: AI Leader avoiding danger from " + enemy.getCharacterId());
                    }
                }

                // Encourage having neighbors (prevents encirclement)
                long neighbors = allPieces.stream()
                        .filter(p -> p.getOwnerIndex() == 1 && !p.getId().equals(piece.getId())
                                && distance(dest.q(), dest.r(), p.getQ(), p.getR()) == 1)
                        .count();
                score += (neighbors * 5);
            } else {
                // If not leader, check if moving here helps protect the leader from
                // encirclement
                int distLeaderToDest = distance(dest.q(), dest.r(), myLeader.getQ(), myLeader.getR());
                if (distLeaderToDest == 1) {
                    score += 15; // Phalanx placement
                }
            }
        }

        // 4. SAFETY : Avoid being captured myself (non-leader units)
        if (!"LEADER".equals(piece.getCharacterId())) {
            long enemiesNearby = enemyPieces.stream()
                    .filter(e -> distance(dest.q(), dest.r(), e.getQ(), e.getR()) == 1)
                    .count();
            if (enemiesNearby > 0)
                score -= (enemiesNearby * 10);
        }

        return score;
    }

    private int distance(int q1, int r1, int q2, int r2) {
        return (Math.abs(q1 - q2) + Math.abs(q1 + r1 - q2 - r2) + Math.abs(r1 - r2)) / 2;
    }

    private boolean canPotentiallyCapture(PieceEntity enemy, int targetQ, int targetR,
            List<PieceEntity> allPieces) {
        int dist = distance(enemy.getQ(), enemy.getR(), targetQ, targetR);
        // Simple heuristic: most pieces capture at distance 1
        if (dist == 1)
            return true;

        // Special units (simplified)
        if ("CAVALRY".equals(enemy.getCharacterId()) && dist == 2)
            return true;
        if ("ARCHER".equals(enemy.getCharacterId()) && dist == 2 && isInLoS(enemy, targetQ, targetR))
            return true;

        return false;
    }

    private boolean isInLoS(PieceEntity p1, int q2, int r2) {
        return p1.getQ() == q2 || p1.getR() == r2 || (p1.getQ() + p1.getR() == q2 + r2);
    }

    private boolean isInLoSCoords(int q1, int r1, int q2, int r2) {
        return q1 == q2 || r1 == r2 || (q1 + r1 == q2 + r2);
    }

    private record Move(PieceEntity piece, HexCoord dest, String abilityId, UUID targetId, HexCoord abilityDest) {
    }
}
