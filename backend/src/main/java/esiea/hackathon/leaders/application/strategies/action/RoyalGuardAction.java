package esiea.hackathon.leaders.application.strategies.action;

import esiea.hackathon.leaders.application.strategies.ActionAbilityStrategy;
import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import esiea.hackathon.leaders.domain.utils.HexUtils;
import org.springframework.stereotype.Component;

import java.util.List;

@Component("royalGuardAction")
public class RoyalGuardAction implements ActionAbilityStrategy {

    @Override
    public String getAbilityId() {
        return "ROYAL_GUARD_PROTECT";
    }

    @Override
    public void execute(PieceEntity source, PieceEntity target, HexCoord dest, HexCoord secondaryDestination,
            List<PieceEntity> allPieces) {
        if (dest == null) {
            throw new IllegalArgumentException("Destination is required for Protection Royale");
        }

        // 1. Trouver le Leader allié
        PieceEntity leader = allPieces.stream()
                .filter(p -> p.getOwnerIndex().equals(source.getOwnerIndex()))
                .filter(p -> "LEADER".equals(p.getCharacterId()))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Leader not found! Power cannot be used."));

        // 2. Vérifier la distance au Leader (Max 2)
        int distToLeader = HexUtils.getDistance(dest.q(), dest.r(), leader.getQ(), leader.getR());
        if (distToLeader > 2) {
            throw new IllegalArgumentException("Destination too far from Leader (max distance 2)");
        }

        // 3. Vérifier que la case est VIDE
        if (HexUtils.isOccupied(dest.q(), dest.r(), allPieces)) {
            throw new IllegalArgumentException("Destination cell is occupied.");
        }

        // 4. Téléportation
        source.setQ(dest.q());
        source.setR(dest.r());
    }
}
