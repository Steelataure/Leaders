package esiea.hackathon.leaders.application.services;

import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AiSimulationService {

    public double evaluateFutureRisk(List<PieceEntity> currentBoard, PieceEntity movingPiece, HexCoord dest) {
        List<PieceEntity> futureBoard = cloneBoard(currentBoard);
        PieceEntity simPiece = futureBoard.stream()
                .filter(p -> p.getId().equals(movingPiece.getId()))
                .findFirst().orElse(null);

        if (simPiece != null) {
            simPiece.setQ(dest.q());
            simPiece.setR(dest.r());
        }

        futureBoard
                .removeIf(p -> p.getQ() == dest.q() && p.getR() == dest.r() && !p.getId().equals(movingPiece.getId()));
        return calculateEnemyThreats(futureBoard, 1);
    }

    /**
     * More advanced simulation for Expert AI.
     */
    public double evaluateDeepRisk(List<PieceEntity> currentBoard, PieceEntity movingPiece, HexCoord dest) {
        List<PieceEntity> futureBoard = cloneBoard(currentBoard);
        PieceEntity simPiece = futureBoard.stream()
                .filter(p -> p.getId().equals(movingPiece.getId()))
                .findFirst().orElse(null);

        if (simPiece != null) {
            simPiece.setQ(dest.q());
            simPiece.setR(dest.r());
        }

        futureBoard
                .removeIf(p -> p.getQ() == dest.q() && p.getR() == dest.r() && !p.getId().equals(movingPiece.getId()));

        double riskScore = calculateEnemyThreats(futureBoard, 1);

        // --- Expert Specific Logic: Ability Combo Prediction ---
        int enemyIndex = 0; // Player
        List<PieceEntity> enemyPieces = futureBoard.stream().filter(p -> p.getOwnerIndex() == enemyIndex).toList();
        List<PieceEntity> myPieces = futureBoard.stream().filter(p -> p.getOwnerIndex() == 1).toList();
        PieceEntity myLeader = myPieces.stream().filter(p -> "LEADER".equals(p.getCharacterId())).findFirst()
                .orElse(null);

        if (myLeader != null) {
            for (PieceEntity enemy : enemyPieces) {
                // Predictive Combo: Illusionist Swap + Another Piece Capture
                if ("ILLUSIONIST".equals(enemy.getCharacterId())) {
                    if (isInLoS(enemy.getQ(), enemy.getR(), myLeader.getQ(), myLeader.getR())) {
                        // If I am swapped, am I in range of ANY other enemy?
                        HexCoord swapPos = new HexCoord(enemy.getQ(), enemy.getR());
                        for (PieceEntity otherEnemy : enemyPieces) {
                            if (otherEnemy.getId().equals(enemy.getId()))
                                continue;
                            if (distance(swapPos.q(), swapPos.r(), otherEnemy.getQ(), otherEnemy.getR()) == 1) {
                                riskScore -= 50000.0; // Very dangerous lethal setup
                            }
                        }
                    }
                }

                // Predictive Combo: Grappler Pull + Sandwich Surround
                if ("GRAPPLER".equals(enemy.getCharacterId())) {
                    int d = distance(enemy.getQ(), enemy.getR(), myLeader.getQ(), myLeader.getR());
                    if (d > 1 && d <= 3 && isInLoS(enemy.getQ(), enemy.getR(), myLeader.getQ(), myLeader.getR())) {
                        // Heuristic: Being pulled closer to a group of enemies is bad
                        long nearbyEnemies = enemyPieces.stream()
                                .filter(e -> distance(enemy.getQ(), enemy.getR(), e.getQ(), e.getR()) <= 2)
                                .count();
                        if (nearbyEnemies >= 2)
                            riskScore -= 10000.0;
                    }
                }

                // Lethal Threat Detection: Can ANY player piece move and capture leader next
                // turn?
                // This is already partially handled by dist==1 in calculateEnemyThreats,
                // but let's add specific check for Archer/Cavalry/Acrobat combo potential.
                if ("ARCHER".equals(enemy.getCharacterId())) {
                    if (distance(enemy.getQ(), enemy.getR(), myLeader.getQ(), myLeader.getR()) == 3) {
                        riskScore -= 1000.0;
                    }
                }

                if ("CAVALRY".equals(enemy.getCharacterId())) {
                    int d = distance(enemy.getQ(), enemy.getR(), myLeader.getQ(), myLeader.getR());
                    if (d <= 3 && isInLoS(enemy.getQ(), enemy.getR(), myLeader.getQ(), myLeader.getR())) {
                        riskScore -= 100000.0; // Avoid being in charge lanes
                    }
                }

                if ("ASSASSIN".equals(enemy.getCharacterId())) {
                    int d = distance(enemy.getQ(), enemy.getR(), myLeader.getQ(), myLeader.getR());
                    if (d == 2) {
                        riskScore -= 50000.0;
                    }
                }

                // --- LETHAL VISION: Lane Detection ---
                // If this move puts Leader in a line with Archer/Cavalry/etc.
                if (isInLoS(enemy.getQ(), enemy.getR(), myLeader.getQ(), myLeader.getR())) {
                    if ("CAVALRY".equals(enemy.getCharacterId()))
                        riskScore -= 20000.0;
                    if ("ARCHER".equals(enemy.getCharacterId()))
                        riskScore -= 10000.0;
                    if ("LANCIER".equals(enemy.getCharacterId()))
                        riskScore -= 5000.0;
                }
            }

            // --- SANDWICH PREVENTION ---
            // If Leader is between 2 enemies on the same axis
            for (int i = 0; i < enemyPieces.size(); i++) {
                for (int j = i + 1; j < enemyPieces.size(); j++) {
                    PieceEntity e1 = enemyPieces.get(i);
                    PieceEntity e2 = enemyPieces.get(j);
                    if (isSandwiched(myLeader.getQ(), myLeader.getR(), e1, e2)) {
                        riskScore -= 80000.0;
                    }
                }
            }
        }

        // --- GOD MODE: PANIC RETURN ---
        if (riskScore <= -1e5)
            return -1e9; // Fatal or Highly likely fatal

        return riskScore;
    }

    private boolean isSandwiched(int q, int r, PieceEntity e1, PieceEntity e2) {
        // Simple check: if myLeader is exactly between e1 and e2 in a line
        int d1 = distance(q, r, e1.getQ(), e1.getR());
        int d2 = distance(q, r, e2.getQ(), e2.getR());
        int d12 = distance(e1.getQ(), e1.getR(), e2.getQ(), e2.getR());
        return (d1 == 1 && d2 == 1 && d12 == 2); // Classic sandwich
    }

    private double calculateEnemyThreats(List<PieceEntity> board, int myOwnerIndex) {
        double hazardScore = 0.0;
        int enemyIndex = (myOwnerIndex == 1) ? 0 : 1;

        List<PieceEntity> myPieces = board.stream().filter(p -> p.getOwnerIndex() == myOwnerIndex).toList();
        List<PieceEntity> enemyPieces = board.stream().filter(p -> p.getOwnerIndex() == enemyIndex).toList();

        PieceEntity myLeader = myPieces.stream()
                .filter(p -> "LEADER".equals(p.getCharacterId()))
                .findFirst().orElse(null);

        if (myLeader == null)
            return -999999.0; // Leader is dead (Panic!)

        // --- GLOBAL PROTECTION: Check threats for EVERY piece ---
        for (PieceEntity myPiece : myPieces) {
            double pieceWeight = "LEADER".equals(myPiece.getCharacterId()) ? 1.0 : 0.4;
            double pieceHazard = 0.0;

            for (PieceEntity enemy : enemyPieces) {
                int dist = distance(enemy.getQ(), enemy.getR(), myPiece.getQ(), myPiece.getR());
                boolean inLos = isInLoS(enemy.getQ(), enemy.getR(), myPiece.getQ(), myPiece.getR());
                String charId = enemy.getCharacterId();

                // 1. DIRECT CAPTURE THREATS (Next turn)
                if (dist == 1) {
                    pieceHazard -= 1500.0; // Standard capture
                }

                // Special capture units
                if ("CAVALRY".equals(charId) && dist <= 2 && inLos)
                    pieceHazard -= 1500.0;
                if ("ARCHER".equals(charId) && dist == 2 && inLos)
                    pieceHazard -= 1200.0;
                if ("ASSASSIN".equals(charId) && dist == 2)
                    pieceHazard -= 2000.0;
                if ("ACROBAT".equals(charId) && dist == 2 && inLos) {
                    HexCoord mid = getMidPoint(enemy.getQ(), enemy.getR(), myPiece.getQ(), myPiece.getR());
                    if (!isCellEmpty(mid.q(), mid.r(), board)) {
                        pieceHazard -= 1000.0;
                    }
                }

                // 2. DISPLACEMENT / CONTROL THREATS
                if (dist > 1 && dist <= 3 && inLos) {
                    if ("GRAPPLER".equals(charId))
                        pieceHazard -= 400.0;
                    if ("ILLUSIONIST".equals(charId))
                        pieceHazard -= 500.0;
                    if ("MANIPULATOR".equals(charId))
                        pieceHazard -= 200.0;
                }

                // --- SETUP PREDICTION: Anticipating Sandwich ---
                if (dist == 1) {
                    for (PieceEntity otherEnemy : enemyPieces) {
                        if (otherEnemy.getId().equals(enemy.getId()))
                            continue;
                        if (isSandwiched(myPiece.getQ(), myPiece.getR(), enemy, otherEnemy)) {
                            pieceHazard -= 800.0; // Potential sandwich setup
                        }
                    }
                }
            }
            hazardScore += (pieceHazard * pieceWeight);
        }

        return hazardScore;
    }

    private HexCoord getMidPoint(int q1, int r1, int q2, int r2) {
        return new HexCoord((short) ((q1 + q2) / 2), (short) ((r1 + r2) / 2));
    }

    private boolean isCellEmpty(short q, short r, List<PieceEntity> board) {
        return board.stream().noneMatch(p -> p.getQ() == q && p.getR() == r);
    }

    // --- Helpers ---

    private List<PieceEntity> cloneBoard(List<PieceEntity> original) {
        return original.stream().map(this::clonePiece).collect(Collectors.toList());
    }

    private PieceEntity clonePiece(PieceEntity p) {
        return PieceEntity.builder()
                .id(p.getId())
                .gameId(p.getGameId())
                .characterId(p.getCharacterId())
                .ownerIndex(p.getOwnerIndex())
                .q(p.getQ())
                .r(p.getR())
                .hasActedThisTurn(p.getHasActedThisTurn())
                .build();
    }

    private int distance(int q1, int r1, int q2, int r2) {
        return (Math.abs(q1 - q2) + Math.abs(q1 + r1 - q2 - r2) + Math.abs(r1 - r2)) / 2;
    }

    private boolean isInLoS(int q1, int r1, int q2, int r2) {
        return q1 == q2 || r1 == r2 || (q1 + r1 == q2 + r2);
    }
}
