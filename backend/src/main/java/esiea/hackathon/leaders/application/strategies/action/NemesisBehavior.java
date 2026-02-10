package esiea.hackathon.leaders.application.strategies.action;

import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import esiea.hackathon.leaders.domain.utils.HexUtils;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class NemesisBehavior {

    // Vitesse de la Némésis : 2 cases
    private static final int SPEED = 2;

    public void react(PieceEntity nemesis, PieceEntity enemyLeader, List<PieceEntity> allPieces) {
        // BFS pour trouver toutes les cases atteignables en 1 ou 2 coups
        Set<HexCoord> visited = new HashSet<>();
        Queue<PathNode> queue = new LinkedList<>();

        HexCoord start = new HexCoord(nemesis.getQ(), nemesis.getR());
        HexCoord target = new HexCoord(enemyLeader.getQ(), enemyLeader.getR());

        // Init
        visited.add(start);
        queue.add(new PathNode(start, 0));

        List<PathNode> candidates = new ArrayList<>();

        while (!queue.isEmpty()) {
            PathNode current = queue.poll();

            // Si on a fait au moins 1 pas, c'est un candidat
            if (current.distFromStart > 0) {
                // On exclut la case du Leader (on ne marche pas dessus)
                if (!current.coord.equals(target)) {
                    candidates.add(current);
                }
            }

            // Si on n'a pas atteint la limite de vitesse, on explore les voisins
            if (current.distFromStart < SPEED) {
                List<HexCoord> neighbors = getNeighbors(current.coord);
                for (HexCoord n : neighbors) {
                    // Vérifier validité + obstacles
                    if (n.isValid() && !visited.contains(n)) {
                        // Est-ce que la case est libre ? (Ou c'est la case cible pour s'en approcher)
                        boolean isTarget = n.equals(target);
                        if (isTarget || !HexUtils.isOccupied(n.q(), n.r(), allPieces)) {
                            visited.add(n);
                            queue.add(new PathNode(n, current.distFromStart + 1));
                        }
                    }
                }
            }
        }

        // Sélection du meilleur candidat
        // Critères :
        // 1. Distance au Leader (Minimiser)
        // 2. Distance parcourue (Maximiser : on veut bouger de 2 cases si possible)
        PathNode bestNode = candidates.stream()
                .min(Comparator.comparingInt((PathNode node) -> HexUtils.getDistance(node.coord, target))
                        .thenComparingInt(node -> -node.distFromStart)) // -dist pour maximiser (2 avant 1)
                .orElse(null);

        if (bestNode != null) {
            nemesis.setQ(bestNode.coord.q());
            nemesis.setR(bestNode.coord.r());
        }
    }

    private List<HexCoord> getNeighbors(HexCoord c) {
        int[][] directions = { { 1, 0 }, { -1, 0 }, { 0, 1 }, { 0, -1 }, { 1, -1 }, { -1, 1 } };
        List<HexCoord> neighbors = new ArrayList<>();
        for (int[] dir : directions) {
            neighbors.add(new HexCoord((short) (c.q() + dir[0]), (short) (c.r() + dir[1])));
        }
        return neighbors;
    }

    private static class PathNode {
        HexCoord coord;
        int distFromStart;

        public PathNode(HexCoord coord, int distFromStart) {
            this.coord = coord;
            this.distFromStart = distFromStart;
        }
    }
}