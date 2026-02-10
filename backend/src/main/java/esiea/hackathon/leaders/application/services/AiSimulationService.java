package esiea.hackathon.leaders.application.services;

import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AiSimulationService {

    /**
     * Simulates the board state after a candidate move and evaluates the danger.
     * Returns a "Risk Score" (Negative value) representing how dangerous this move
     * is.
     * 0.0 means safe. -Infinity means fatal.
     */
    public double evaluateFutureRisk(List<PieceEntity> currentBoard, PieceEntity movingPiece, HexCoord dest) {
        // 1. Clone the board to create a "Future State"
        List<PieceEntity> futureBoard = cloneBoard(currentBoard);

        // 2. Apply the move in the simulation
        PieceEntity simPiece = futureBoard.stream()
                .filter(p -> p.getId().equals(movingPiece.getId()))
                .findFirst().orElse(null);

        if (simPiece != null) {
            simPiece.setQ(dest.q());
            simPiece.setR(dest.r());
        }

        // 3. Remove captured piece if any
        futureBoard
                .removeIf(p -> p.getQ() == dest.q() && p.getR() == dest.r() && !p.getId().equals(movingPiece.getId()));

        // 4. Evaluate Enemy Responses
        return calculateEnemyThreats(futureBoard, 1); // AI is usually player 1
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
            return -999999.0; // Already dead (Panic!)

        for (PieceEntity enemy : enemyPieces) {
            String charId = enemy.getCharacterId();
            int dist = distance(enemy.getQ(), enemy.getR(), myLeader.getQ(), myLeader.getR());
            boolean inLos = isInLoS(enemy.getQ(), enemy.getR(), myLeader.getQ(), myLeader.getR());

            // --- 1. KILL THREATS (Capture) ---

            // Standard Move Capture (Range 1)
            if (dist == 1)
                return -100000.0;

            // CAVALRY: Move 2 straight
            if ("CAVALRY".equals(charId) && dist == 2 && inLos)
                return -100000.0;

            // ACROBAT: Jump over 1 unit (Range 2)
            if ("ACROBAT".equals(charId) && dist == 2 && inLos) {
                // Check if there is a unit to jump over (middle hex)
                HexCoord mid = getMidPoint(enemy.getQ(), enemy.getR(), myLeader.getQ(), myLeader.getR());
                if (!isCellEmpty(mid.q(), mid.r(), board))
                    return -100000.0;
            }

            // PROWLER: Stealth (Can jump anywhere non-adjacent to enemies... if Leader is
            // alone, Prowler can capture?)
            // Prowler moves to a spot, then next turn captures. But if it can capture THIS
            // turn, it means it was already close.
            // Actually Prowler's ability is a MOVE. To capture, it must move ONTO the
            // leader.
            // Prowler cannot land adjacent to an enemy. So it cannot capture directly with
            // ability unless target blocks?
            // "Se déplace sur n’importe quelle case non-adjacente à un ennemi." -> It
            // cannot capture with Stealth.
            // But it can Move normally (dist 1). (Handled above).

            // ASSASSIN: Solo Capture (Passive)
            // If Assassin moves adjacent (dist 1), it captures. Handled by "Standard Move".
            // But AI must strictly avoid ending turn adjacent to Assassin.
            // If Assassin is at dist 2, it can move and kill. (Handled by Standard Move
            // check if we simulating THEIR turn).
            // Wait, calculateEnemyThreats checks if THEY can kill US in THEIR next turn.

            // ARCHER: Ranged Capture (Passive)
            // If Archer is at dist 2 line, and SOMEONE acts as anvil... leader dies.
            if ("ARCHER".equals(charId) && dist == 2 && inLos) {
                // Check if there is an anvil (enemy of Archer = my friendly unit?)
                // No, standard capture is Sandwich. Archer counts as one bun at dist 2.
                // We need to check if there is an ENEMY (Ally of Archer) at dist 1 opposite to
                // Archer.
                // Actually, simpler heuristic: Archer at dist 2 is VERY DANGEROUS.
                hazardScore -= 2000.0;
            }

            // --- 2. DISPLACEMENT / CONTROL THREATS ---

            // GRAPPLER: Hook (Range 2-3 Line)
            if ("GRAPPLER".equals(charId) && dist > 1 && dist <= 3 && inLos) {
                // Pulls Leader. Dangerous.
                hazardScore -= 500.0;
            }

            // ILLUSIONIST: Swap (Range 2-3 Line)
            if ("ILLUSIONIST".equals(charId) && dist > 1 && dist <= 3 && inLos) {
                hazardScore -= 600.0; // Swapping Leader is usually death
            }

            // BRAWLER: Push (Adj) -> Handled by dist=1 check?
            // Brawler adjacent can push Leader into danger.
            if ("BRAWLER".equals(charId) && dist == 1) {
                hazardScore -= 300.0;
            }

            // MANIPULATOR: Move 1 (Range 2-3?)
            // "Déplace d’une case un ennemi visible en ligne droite et non-adjacent."
            if ("MANIPULATOR".equals(charId) && dist > 1 && inLos) {
                hazardScore -= 200.0;
            }

            // JAILER: Block (Adj)
            if ("JAILER".equals(charId) && dist == 1) {
                hazardScore -= 100.0; // Annoying but not fatal immediately
            }

            // OLD_BEAR / CUB (Just standard units)

            // General Proximity Danger (Swarm)
            if (dist <= 2)
                hazardScore -= 50.0;
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
