package esiea.hackathon.leaders.application.strategies.passive;

import esiea.hackathon.leaders.application.strategies.PassiveAbilityStrategy;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import org.springframework.stereotype.Component;

@Component
public class AssassinSoloStrategy implements PassiveAbilityStrategy {
    @Override
    public String getAbilityId() { return "ASSASSIN_SOLO"; }

    public boolean canCaptureLeaderAlone(PieceEntity assassin, PieceEntity enemyLeader) {
        return true;
    }
}