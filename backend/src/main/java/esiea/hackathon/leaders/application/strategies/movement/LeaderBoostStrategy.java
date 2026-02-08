package esiea.hackathon.leaders.application.strategies.movement;

import esiea.hackathon.leaders.application.strategies.MoveAbilityStrategy;
import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Component
public class LeaderBoostStrategy implements MoveAbilityStrategy {

    @Override
    public String getAbilityId() {
        return "VIZIER_BOOST";
    }

    @Override
    public List<HexCoord> getExtraMoves(PieceEntity piece, List<PieceEntity> allPieces) {
        // 1. Sécurité : Cette logique ne s'applique qu'au LEADER
        if (!"LEADER".equals(piece.getCharacterId())) {
            return Collections.emptyList();
        }

        // 2. Vérifier la présence d'un VIZIR allié sur le plateau
        boolean hasVizierAlly = allPieces.stream()
                .anyMatch(p -> "VIZIER".equals(p.getCharacterId())
                        && p.getOwnerIndex().equals(piece.getOwnerIndex()));

        if (!hasVizierAlly) {
            return Collections.emptyList();
        }

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
        return moves;
    }

    private boolean isFree(HexCoord coord, List<PieceEntity> pieces) {
        return pieces.stream().noneMatch(p -> p.getQ() == coord.q() && p.getR() == coord.r());
    }
}