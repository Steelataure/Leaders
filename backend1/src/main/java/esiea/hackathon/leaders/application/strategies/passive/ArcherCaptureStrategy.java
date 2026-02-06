package esiea.hackathon.leaders.application.strategies.passive;

import esiea.hackathon.leaders.application.strategies.PassiveAbilityStrategy;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import org.springframework.stereotype.Component;

@Component
public class ArcherCaptureStrategy implements PassiveAbilityStrategy {
    @Override
    public String getAbilityId() { return "ARCHER_RANGE"; }

    public boolean canHelpCapture(PieceEntity archer, PieceEntity target) {
        int dist = getDistance(archer, target);
        // Participe si distance == 2, mais pas si adjacent (dist == 1)
        return dist == 2;
    }

    private int getDistance(PieceEntity p1, PieceEntity p2) {
        return (Math.abs(p1.getQ() - p2.getQ())
                + Math.abs(p1.getR() - p2.getR())
                + Math.abs((p1.getQ()+p1.getR()) - (p2.getQ()+p2.getR()))) / 2;
    }
}