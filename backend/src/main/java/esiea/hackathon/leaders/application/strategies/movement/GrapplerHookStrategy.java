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
public class GrapplerHookStrategy implements MoveAbilityStrategy {

    private static final Logger LOGGER = LogManager.getLogger(GrapplerHookStrategy.class);

    @Override
    public String getAbilityId() { return "GRAPPLE_HOOK"; }

    @Override
    public List<HexCoord> getExtraMoves(PieceEntity piece, List<PieceEntity> allPieces) {
        LOGGER.info("Calcul des mouvements bonus (Grappin) pour l'unité à la position [{}, {}]", piece.getQ(), piece.getR());
        
        List<HexCoord> targets = new ArrayList<>();
        int[][] directions = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}, {1, -1}, {-1, 1}};

        for (int[] dir : directions) {
            LOGGER.debug("Exploration de la direction: dQ={}, dR={}", dir[0], dir[1]);
            
            for (int dist = 1; dist <= 6; dist++) {
                short tQ = (short) (piece.getQ() + (dir[0] * dist));
                short tR = (short) (piece.getR() + (dir[1] * dist));
                HexCoord current = new HexCoord(tQ, tR);
                
                if (!current.isValid()) {
                    LOGGER.trace("Position hors limites atteinte à la distance {}. Arrêt sur cet axe.", dist);
                    break;
                }

                PieceEntity occupant = allPieces.stream()
                        .filter(p -> p.getQ() == tQ && p.getR() == tR).findFirst().orElse(null);

                if (occupant != null) {
                    // On peut viser n'importe qui (Allié ou Ennemi)
                    LOGGER.debug("Cible potentielle détectée à [{}, {}] (Distance: {})", tQ, tR, dist);
                    targets.add(current);
                    break;
                }
            }
        }
        
        LOGGER.info("{} cible(s) de grappin trouvée(s).", targets.size());
        return targets;
    }
}