package esiea.hackathon.leaders.application.services;

import esiea.hackathon.leaders.application.strategies.passive.ArcherCaptureStrategy;
import esiea.hackathon.leaders.application.strategies.passive.AssassinSoloStrategy;
import esiea.hackathon.leaders.application.strategies.passive.PassiveFactory;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import esiea.hackathon.leaders.domain.model.VictoryCheckResult;
import esiea.hackathon.leaders.domain.model.enums.VictoryType;
import esiea.hackathon.leaders.domain.repository.PieceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VictoryService {

    private final PieceRepository pieceRepository;
    private final PassiveFactory passiveFactory;

    /**
     * Vérifie si la partie est terminée.
     * Retourne un objet de résultat (Value Object) au lieu de lever une exception.
     */
    public VictoryCheckResult checkVictory(UUID gameId) {
        List<PieceEntity> allPieces = pieceRepository.findByGameId(gameId);

        // Récupérer les Leaders
        List<PieceEntity> leaders = allPieces.stream()
                .filter(p -> "LEADER".equals(p.getCharacterId()))
                .toList();

        for (PieceEntity leader : leaders) {
            // Le gagnant est l'adversaire du leader qui subit la défaite.
            // Si le Leader du J0 (index 0) perd, le winnerIndex est 1.
            int winnerIndex = (leader.getOwnerIndex() == 0) ? 1 : 0;

            // 1. Condition de Capture (Prise en tenaille ou Assassin)
            if (isCaptured(leader, allPieces)) {
                return VictoryCheckResult.victory(winnerIndex, VictoryType.CAPTURE);
            }

            // 2. Condition d'Encerclement (Bloqué de tous les côtés)
            if (isEncircled(leader, allPieces)) {
                return VictoryCheckResult.victory(winnerIndex, VictoryType.ENCIRCLEMENT);
            }
        }

        // Aucune condition de victoire détectée
        return VictoryCheckResult.noVictory();
    }

    /**
     * Logique de Capture incluant les stratégies passives (Assassin, Archer).
     */
    private boolean isCaptured(PieceEntity leader, List<PieceEntity> allPieces) {
        List<PieceEntity> enemies = allPieces.stream()
                .filter(p -> !p.getOwnerIndex().equals(leader.getOwnerIndex()))
                .toList();

        // Récupération des stratégies via la Factory
        ArcherCaptureStrategy archerStrat = passiveFactory.getStrategy("ARCHER_RANGE", ArcherCaptureStrategy.class);
        AssassinSoloStrategy assassinStrat = passiveFactory.getStrategy("ASSASSIN_SOLO", AssassinSoloStrategy.class);

        int capturePoints = 0;

        for (PieceEntity enemy : enemies) {
            // L'Ourson (CUB) ne participe jamais à la capture
            if ("CUB".equals(enemy.getCharacterId())) continue;

            boolean standardAdjacency = areAdjacent(enemy, leader);

            // --- CAS 1 : ADJACENCE STANDARD (Distance 1) ---
            if (standardAdjacency) {
                // Si c'est un Assassin, il vaut 2 points (Capture immédiate)
                if ("ASSASSIN".equals(enemy.getCharacterId()) && assassinStrat != null
                        && assassinStrat.canCaptureLeaderAlone(enemy, leader)) {
                    capturePoints += 2;
                } else {
                    // Toute autre unité vaut 1 point
                    capturePoints++;
                }
            }
            // --- CAS 2 : DISTANCE (Spécial Archer) ---
            // Si pas adjacent, on vérifie si l'Archer peut tirer de loin (Distance 2)
            else if ("ARCHER".equals(enemy.getCharacterId()) && archerStrat != null) {
                if (archerStrat.canHelpCapture(enemy, leader)) {
                    capturePoints++;
                }
            }
        }

        // VICTOIRE SI : Au moins 2 points d'attaque cumulés
        return capturePoints >= 2;
    }

    /**
     * Logique d'Encerclement : Les 6 cases autour sont bloquées.
     */
    private boolean isEncircled(PieceEntity leader, List<PieceEntity> allPieces) {
        int[][] directions = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}, {1, -1}, {-1, 1}};
        int blockedSides = 0;

        for (int[] dir : directions) {
            short q = (short) (leader.getQ() + dir[0]);
            short r = (short) (leader.getR() + dir[1]);

            // Bloqué si hors plateau (Mur)
            if (!isValidHexCoord(q, r)) {
                blockedSides++;
                continue;
            }

            // Bloqué si case occupée par n'importe qui
            boolean occupied = allPieces.stream().anyMatch(p -> p.getQ() == q && p.getR() == r);
            if (occupied) {
                blockedSides++;
            }
        }

        return blockedSides == 6;
    }

    // --- Helpers ---
    private boolean areAdjacent(PieceEntity p1, PieceEntity p2) {
        return getDistance(p1, p2) == 1;
    }

    private int getDistance(PieceEntity p1, PieceEntity p2) {
        return (Math.abs(p1.getQ() - p2.getQ())
                + Math.abs(p1.getR() - p2.getR())
                + Math.abs((p1.getQ() + p1.getR()) - (p2.getQ() + p2.getR()))) / 2;
    }

    private boolean isValidHexCoord(short q, short r) {
        return Math.abs(q) <= 3 && Math.abs(r) <= 3 && Math.abs(q + r) <= 3;
    }
}