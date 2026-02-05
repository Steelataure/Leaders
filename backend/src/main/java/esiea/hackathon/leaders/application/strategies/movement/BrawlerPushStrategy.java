package esiea.hackathon.leaders.application.strategies.movement;

import esiea.hackathon.leaders.application.strategies.MoveAbilityStrategy;
import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class BrawlerPushStrategy implements MoveAbilityStrategy {

    private static final Logger LOGGER = LogManager.getLogger(BrawlerPushStrategy.class);

    @Override
    public String getAbilityId() { return "BRAWLER_PUSH"; }

    @Override
    public List<HexCoord> getExtraMoves(PieceEntity piece, List<PieceEntity> allPieces) {
        LOGGER.info("Calcul des mouvements supplémentaires pour l'entité à la position ({}, {})", 
                piece.getQ(), piece.getR());
        
        List<HexCoord> moves = new ArrayList<>();
        int[][] directions = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}, {1, -1}, {-1, 1}};

        for (int[] dir : directions) {
            short nQ = (short) (piece.getQ() + dir[0]);
            short nR = (short) (piece.getR() + dir[1]);
            HexCoord target = new HexCoord(nQ, nR);

            // On cherche un ENNEMI adjacent
            if (target.isValid()) {
                if (isEnemy(nQ, nR, piece.getOwnerIndex(), allPieces)) {
                    LOGGER.debug("Ennemi détecté à ({}, {}). Ajout du mouvement de poussée.", nQ, nR);
                    moves.add(target);
                }
            } else {
                LOGGER.trace("Coordonnées ({}, {}) invalides (hors limites).", nQ, nR);
            }
        }
        
        LOGGER.debug("Nombre de mouvements trouvés : {}", moves.size());
        return moves;
    }

    private boolean isEnemy(short q, short r, Short myOwner, List<PieceEntity> pieces) {
        boolean enemyFound = pieces.stream().anyMatch(p -> p.getQ() == q && p.getR() == r && !p.getOwnerIndex().equals(myOwner));
        if (enemyFound) {
            LOGGER.trace("Cible confirmée comme ennemie à ({}, {})", q, r);
        }
        return enemyFound;
    }
}