package esiea.hackathon.leaders.application.strategies.action;

import esiea.hackathon.leaders.domain.model.PieceEntity;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class NemesisBehavior {

    // Vitesse de la Némésis : 2 cases
    private static final int SPEED = 2;

    public void react(PieceEntity nemesis, PieceEntity enemyLeader, List<PieceEntity> allPieces) {
        // On effectue 2 pas successifs
        for (int i = 0; i < SPEED; i++) {
            PieceEntity nextStep = findBestStep(nemesis, enemyLeader, allPieces);

            // Si on a trouvé une case libre qui nous rapproche
            if (nextStep != null) {
                // On vérifie qu'on ne marche pas SUR le Leader (on s'arrête juste avant)
                if (nextStep.getQ() == enemyLeader.getQ() && nextStep.getR() == enemyLeader.getR()) {
                    break; // On est au contact, on arrête de bouger
                }

                // Application du mouvement
                nemesis.setQ(nextStep.getQ());
                nemesis.setR(nextStep.getR());
            } else {
                break; // Bloquée
            }
        }
    }

    private PieceEntity findBestStep(PieceEntity current, PieceEntity target, List<PieceEntity> obstacles) {
        int currentDist = esiea.hackathon.leaders.domain.utils.HexUtils.getDistance(current.getQ(), current.getR(),
                target.getQ(), target.getR());
        PieceEntity bestMove = null;
        int minDist = currentDist;

        // Les 6 directions hexagonales
        int[][] directions = { { 1, 0 }, { -1, 0 }, { 0, 1 }, { 0, -1 }, { 1, -1 }, { -1, 1 } };

        for (int[] dir : directions) {
            short nQ = (short) (current.getQ() + dir[0]);
            short nR = (short) (current.getR() + dir[1]);

            esiea.hackathon.leaders.domain.model.HexCoord nCoord = new esiea.hackathon.leaders.domain.model.HexCoord(nQ,
                    nR);

            // On vérifie si la case est sur le plateau
            if (!nCoord.isValid())
                continue;

            // On vérifie si la case est libre (sauf si c'est la case du Leader lui-même,
            // car on veut "tendre" vers lui)
            boolean isTargetCell = (nQ == target.getQ() && nR == target.getR());
            if (!isTargetCell && esiea.hackathon.leaders.domain.utils.HexUtils.isOccupied(nQ, nR, obstacles))
                continue;

            // Calcul de la distance potentielle
            PieceEntity temp = new PieceEntity();
            temp.setQ(nQ);
            temp.setR(nR);

            int newDist = esiea.hackathon.leaders.domain.utils.HexUtils.getDistance(nQ, nR, target.getQ(),
                    target.getR());

            // On cherche à RÉDUIRE la distance strictement
            if (newDist < minDist) {
                minDist = newDist;
                bestMove = temp;
            }
        }
        return bestMove;
    }
}