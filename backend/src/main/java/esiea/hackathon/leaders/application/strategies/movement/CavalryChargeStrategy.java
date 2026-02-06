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
public class CavalryChargeStrategy implements MoveAbilityStrategy {

    private static final Logger LOGGER = LogManager.getLogger(CavalryChargeStrategy.class);

    @Override
    public String getAbilityId() {
        return "CAVALRY_CHARGE";
    }

    @Override
    public List<HexCoord> getExtraMoves(PieceEntity piece, List<PieceEntity> allPieces) {
        LOGGER.debug("Calcul des mouvements de charge pour la pièce en ({}, {})", piece.getQ(), piece.getR());
        
        List<HexCoord> moves = new ArrayList<>();
        // Directions : E, W, SE, NW, SW, NE
        int[][] directions = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}, {1, -1}, {-1, 1}};

        for (int[] dir : directions) {
            // Case à distance 2 (Charge)
            short targetQ = (short) (piece.getQ() + (dir[0] * 2));
            short targetR = (short) (piece.getR() + (dir[1] * 2));

            // Case intermédiaire (doit être vide pour charger à travers)
            short midQ = (short) (piece.getQ() + dir[0]);
            short midR = (short) (piece.getR() + dir[1]);

            HexCoord target = new HexCoord(targetQ, targetR);

            // Conditions : Cible valide + Cible vide + Passage vide
            if (target.isValid() && isFree(targetQ, targetR, allPieces) && isFree(midQ, midR, allPieces)) {
                LOGGER.debug("Mouvement de charge valide trouvé vers ({}, {})", targetQ, targetR);
                moves.add(target);
            }
        }
        
        LOGGER.info("Nombre de mouvements de charge trouvés : {}", moves.size());
        return moves;
    }

    private boolean isFree(short q, short r, List<PieceEntity> pieces) {
        boolean free = pieces.stream().noneMatch(p -> p.getQ() == q && p.getR() == r);
        LOGGER.trace("Vérification case ({}, {}) : {}", q, r, free ? "Libre" : "Occupée");
        return free;
    }
}