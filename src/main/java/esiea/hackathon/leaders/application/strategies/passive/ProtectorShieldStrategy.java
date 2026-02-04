package esiea.hackathon.leaders.application.strategies.passive;

import esiea.hackathon.leaders.application.strategies.PassiveAbilityStrategy;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import org.springframework.stereotype.Component;

@Component
public class ProtectorShieldStrategy implements PassiveAbilityStrategy {
    @Override
    public String getAbilityId() { return "PROTECTOR_SHIELD"; }

    public boolean isProtecting(PieceEntity protector, PieceEntity target) {
        // Protège si la cible est lui-même OU un allié adjacent
        return protector.getId().equals(target.getId()) || areAdjacent(protector, target);
    }

    private boolean areAdjacent(PieceEntity p1, PieceEntity p2) {
        int dist = (Math.abs(p1.getQ() - p2.getQ())
                + Math.abs(p1.getR() - p2.getR())
                + Math.abs((p1.getQ()+p1.getR()) - (p2.getQ()+p2.getR()))) / 2;
        return dist == 1;
    }
}