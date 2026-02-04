package esiea.hackathon.leaders.application.strategies.special;

import org.springframework.stereotype.Component;

@Component
public class AssassinSpecialSoloStrategy {
    public String getAbilityId() { return "ASSASSIN_SOLO"; }

    // L'assassin peut capturer seul (vaut comme 2 points de capture)
    public boolean canCaptureAlone() {
        return true;
    }
}