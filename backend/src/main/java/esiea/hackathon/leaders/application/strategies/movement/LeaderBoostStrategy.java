package esiea.hackathon.leaders.application.strategies.movement;

import esiea.hackathon.leaders.application.strategies.MoveAbilityStrategy;
import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Component
public class LeaderBoostStrategy implements MoveAbilityStrategy {

    private static final Logger LOGGER = LogManager.getLogger(LeaderBoostStrategy.class);

    @Override
    public String getAbilityId() {
        return "VIZIER_BOOST";
    }

    @Override
    public List<HexCoord> getExtraMoves(PieceEntity piece, List<PieceEntity> allPieces) {
        LOGGER.info("Calcul des mouvements bonus pour la pièce : {} (Propriétaire : {})", 
                piece.getCharacterId(), piece.getOwnerIndex());

        // 1. Sécurité : Cette logique ne s'applique qu'au LEADER
        if (!"LEADER".equals(piece.getCharacterId())) {
            LOGGER.debug("La pièce n'est pas un LEADER, aucune action requise.");
            return Collections.emptyList();
        }

        // 2. Vérifier la présence d'un VIZIR allié sur le plateau
        boolean hasVizierAlly = allPieces.stream()
                .anyMatch(p -> "VIZIER".equals(p.getCharacterId())
                        && p.getOwnerIndex().equals(piece.getOwnerIndex()));

        if (!hasVizierAlly) {
            LOGGER.warn("Aucun VIZIR allié trouvé pour le LEADER {}. Boost annulé.", piece.getOwnerIndex());
            return Collections.emptyList();
        }

        LOGGER.info("VIZIR allié détecté. Calcul de l'anneau de distance 2...");

        // 3. Calculer les cases à distance 2 (Bonus)
        // (Les cases à distance 1 sont déjà gérées par le mouvement standard)
        List<HexCoord> moves = new ArrayList<>();
        int currentQ = piece.getQ();
        int currentR = piece.getR();

        // On parcourt un anneau de rayon 2
        for (int q = -2; q <= 2; q++) {
            for (int r = -2; r <= 2; r++) {
                // Formule de distance hexagonale : (|q| + |r| + |q+r|) / 2
                if ((Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2 == 2) {

                    HexCoord target = new HexCoord((short)(currentQ + q), (short)(currentR + r));

                    if (target.isValid() && isFree(target, allPieces)) {
                        moves.add(target);
                    }
                }
            }
        }

        LOGGER.info("Boost terminé : {} cases bonus trouvées.", moves.size());
        return moves;
    }

    private boolean isFree(HexCoord coord, List<PieceEntity> pieces) {
        return pieces.stream().noneMatch(p -> p.getQ() == coord.q() && p.getR() == coord.r());
    }
}