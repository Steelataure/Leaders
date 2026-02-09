package esiea.hackathon.leaders.application.strategies.passive;

import esiea.hackathon.leaders.application.strategies.PassiveAbilityStrategy;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import org.springframework.stereotype.Component;

@Component
public class ArcherCaptureStrategy implements PassiveAbilityStrategy {
    @Override
    public String getAbilityId() {
        return "ARCHER_RANGE";
    }

    public boolean canHelpCapture(PieceEntity archer, PieceEntity target) {
        esiea.hackathon.leaders.domain.model.HexCoord a = new esiea.hackathon.leaders.domain.model.HexCoord(
                archer.getQ(), archer.getR());
        esiea.hackathon.leaders.domain.model.HexCoord t = new esiea.hackathon.leaders.domain.model.HexCoord(
                target.getQ(), target.getR());

        int dist = esiea.hackathon.leaders.domain.utils.HexUtils.getDistance(a, t);

        // Participe si distance == 2 ET aligné (Ligne Droite)
        // Si distance == 1, c'est l'adjacence standard qui compte (géré par
        // VictoryService)
        return dist == 2 && esiea.hackathon.leaders.domain.utils.HexUtils.isAligned(a, t);
    }
}