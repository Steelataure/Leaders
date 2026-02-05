package esiea.hackathon.leaders.application.strategies.action;

import esiea.hackathon.leaders.domain.model.PieceEntity;
import org.springframework.stereotype.Component;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.util.List;

@Component
public class NemesisBehavior {

    private static final Logger LOGGER = LogManager.getLogger(NemesisBehavior.class);

    // Vitesse de la Némésis : 2 cases
    private static final int SPEED = 2;

    public void react(PieceEntity nemesis, PieceEntity enemyLeader, List<PieceEntity> allPieces) {
        LOGGER.info("Début de la réaction de la Némésis. Cible : Leader en ({}, {})", enemyLeader.getQ(), enemyLeader.getR());

        // On effectue 2 pas successifs
        for (int i = 0; i < SPEED; i++) {
            PieceEntity nextStep = findBestStep(nemesis, enemyLeader, allPieces);

            // Si on a trouvé une case libre qui nous rapproche
            if (nextStep != null) {
                // On vérifie qu'on ne marche pas SUR le Leader (on s'arrête juste avant)
                if (nextStep.getQ() == enemyLeader.getQ() && nextStep.getR() == enemyLeader.getR()) {
                    LOGGER.debug("Némésis au contact du Leader. Arrêt du mouvement.");
                    break; // On est au contact, on arrête de bouger
                }

                // Application du mouvement
                nemesis.setQ(nextStep.getQ());
                nemesis.setR(nextStep.getR());
                LOGGER.debug("Pas {} : Némésis se déplace en ({}, {})", i + 1, nextStep.getQ(), nextStep.getR());
            } else {
                LOGGER.warn("Némésis bloquée : aucun mouvement possible vers la cible.");
                break; // Bloquée
            }
        }
        LOGGER.info("Fin du mouvement de la Némésis. Position finale : ({}, {})", nemesis.getQ(), nemesis.getR());
    }

    private PieceEntity findBestStep(PieceEntity current, PieceEntity target, List<PieceEntity> obstacles) {
        int currentDist = getDistance(current, target);
        PieceEntity bestMove = null;
        int minDist = currentDist;

        // Les 6 directions hexagonales
        int[][] directions = {{1,0}, {-1,0}, {0,1}, {0,-1}, {1,-1}, {-1,1}};

        for (int[] dir : directions) {
            short nQ = (short) (current.getQ() + dir[0]);
            short nR = (short) (current.getR() + dir[1]);

            // On vérifie si la case est sur le plateau
            if (!isValid(nQ, nR)) continue;

            // On vérifie si la case est libre (sauf si c'est la case du Leader lui-même, car on veut "tendre" vers lui)
            boolean isTargetCell = (nQ == target.getQ() && nR == target.getR());
            if (!isTargetCell && !isFree(nQ, nR, obstacles)) continue;

            // Calcul de la distance potentielle
            PieceEntity temp = new PieceEntity();
            temp.setQ(nQ);
            temp.setR(nR);

            int newDist = getDistance(temp, target);

            // On cherche à RÉDUIRE la distance strictement
            if (newDist < minDist) {
                minDist = newDist;
                bestMove = temp;
            }
        }
        return bestMove;
    }

    private boolean isFree(short q, short r, List<PieceEntity> pieces) {
        return pieces.stream().noneMatch(p -> p.getQ() == q && p.getR() == r);
    }

    private boolean isValid(short q, short r) {
        return Math.abs(q) <= 3 && Math.abs(r) <= 3 && Math.abs(q + r) <= 3;
    }

    private int getDistance(PieceEntity p1, PieceEntity p2) {
        return (Math.abs(p1.getQ() - p2.getQ())
                + Math.abs(p1.getR() - p2.getR())
                + Math.abs((p1.getQ() + p1.getR()) - (p2.getQ() + p2.getR()))) / 2;
    }
}