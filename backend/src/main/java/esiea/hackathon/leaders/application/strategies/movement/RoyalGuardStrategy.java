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
public class RoyalGuardStrategy implements MoveAbilityStrategy {

    private static final Logger LOGGER = LogManager.getLogger(RoyalGuardStrategy.class);

    @Override
    public String getAbilityId() { return "ROYAL_GUARD_PROTECT"; }

    @Override
    public List<HexCoord> getExtraMoves(PieceEntity piece, List<PieceEntity> allPieces) {
        LOGGER.info("Calcul des mouvements supplémentaires pour la Garde Royale (ID: {})", piece.getId());
        List<HexCoord> moves = new ArrayList<>();

        // 1. Trouver le Leader allié
        PieceEntity leader = allPieces.stream()
                .filter(p -> p.getOwnerIndex().equals(piece.getOwnerIndex())) // Même équipe
                .filter(p -> "LEADER".equals(p.getCharacterId()))
                .findFirst()
                .orElse(null);

        if (leader == null) { // Pas de leader, pas de pouvoir
            LOGGER.warn("Aucun leader trouvé pour l'équipe {}. Capacité annulée.", piece.getOwnerIndex());
            return moves; 
        }

        LOGGER.debug("Leader trouvé en ({}, {}). Analyse des cases adjacentes.", leader.getQ(), leader.getR());

        // 2. Ajouter toutes les cases vides autour du leader
        int[][] directions = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}, {1, -1}, {-1, 1}};
        for (int[] dir : directions) {
            short adjQ = (short) (leader.getQ() + dir[0]);
            short adjR = (short) (leader.getR() + dir[1]);
            HexCoord target = new HexCoord(adjQ, adjR);

            if (target.isValid() && isFree(target.q(), target.r(), allPieces)) {
                LOGGER.trace("Mouvement possible ajouté : ({}, {})", adjQ, adjR);
                moves.add(target);
            }
        }
        
        LOGGER.info("{} mouvements de protection trouvés autour du leader.", moves.size());
        return moves;
    }

    private boolean isFree(short q, short r, List<PieceEntity> pieces) {
        return pieces.stream().noneMatch(p -> p.getQ() == q && p.getR() == r);
    }
}