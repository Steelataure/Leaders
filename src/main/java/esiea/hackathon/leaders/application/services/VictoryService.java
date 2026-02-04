package esiea.hackathon.leaders.application.services;

import esiea.hackathon.leaders.application.strategies.special.ArcherSpecialCaptureStrategy;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import esiea.hackathon.leaders.domain.repository.PieceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VictoryService {

    private final PieceRepository pieceRepository;
    private final ArcherSpecialCaptureStrategy archerStrat;

    /**
     * Vérifie les conditions de victoire.
     * Lance une exception (ou retourne un objet Victoire) si la partie est finie.
     */
    public void checkVictory(UUID gameId) {
        List<PieceEntity> allPieces = pieceRepository.findByGameId(gameId);

        // Récupérer les Leaders
        List<PieceEntity> leaders = allPieces.stream()
                .filter(p -> "LEADER".equals(p.getCharacterId()))
                .toList();

        for (PieceEntity leader : leaders) {
            // 1. Vérifier la CAPTURE
            if (isCaptured(leader, allPieces)) {
                throw new IllegalStateException("VICTORY! Leader " + leader.getOwnerIndex() + " captured!");
            }

            // 2. Vérifier l'ENCERCLEMENT
            if (isEncircled(leader, allPieces)) {
                throw new IllegalStateException("VICTORY! Leader " + leader.getOwnerIndex() + " encircled!");
            }
        }
    }

    private boolean isCaptured(PieceEntity leader, List<PieceEntity> allPieces) {
        // Filtrer les ennemis
        List<PieceEntity> enemies = allPieces.stream()
                .filter(p -> !p.getOwnerIndex().equals(leader.getOwnerIndex()))
                .toList();

        int capturePoints = 0;

        for (PieceEntity enemy : enemies) {
            // L'OURSON ne capture jamais
            if ("CUB".equals(enemy.getCharacterId())) continue;

            boolean isArcher = "ARCHER".equals(enemy.getCharacterId());
            boolean isAssassin = "ASSASSIN".equals(enemy.getCharacterId());

            if (isArcher) {
                // Règle Archer : Capture à distance 2 uniquement
                if (archerStrat.contributesToCapture(enemy, leader)) {
                    capturePoints++;
                }
            } else {
                // Règle Standard : Capture si adjacent
                if (areAdjacent(enemy, leader)) {
                    // Règle Assassin : Vaut 2 points (Capture instantanée)
                    capturePoints += (isAssassin ? 2 : 1);
                }
            }
        }

        // Il faut >= 2 points pour capturer (soit 2 unités, soit 1 Assassin)
        return capturePoints >= 2;
    }

    private boolean isEncircled(PieceEntity leader, List<PieceEntity> allPieces) {
        // Vérifier les 6 voisins. S'ils sont tous occupés (ami ou ennemi) ou hors plateau.
        int[][] directions = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}, {1, -1}, {-1, 1}};
        int blockedSides = 0;

        for (int[] dir : directions) {
            short q = (short) (leader.getQ() + dir[0]);
            short r = (short) (leader.getR() + dir[1]);

            // Si hors plateau, ça compte comme un mur (bloqué)
            if (!isValidHexCoord(q, r)) {
                blockedSides++;
                continue;
            }

            // Si occupé par une pièce
            boolean occupied = allPieces.stream().anyMatch(p -> p.getQ() == q && p.getR() == r);
            if (occupied) {
                blockedSides++;
            }
        }
        return blockedSides == 6;
    }

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