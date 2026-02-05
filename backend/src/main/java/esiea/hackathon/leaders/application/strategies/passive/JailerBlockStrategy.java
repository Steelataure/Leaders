package esiea.hackathon.leaders.application.strategies.passive;

import esiea.hackathon.leaders.application.strategies.PassiveAbilityStrategy;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import org.springframework.stereotype.Component;

@Component
public class JailerBlockStrategy implements PassiveAbilityStrategy {
    @Override
    public String getAbilityId() { return "JAILER_BLOCK"; }

    public boolean isBlocking(PieceEntity jailer, PieceEntity enemy) {
        // Si l'ennemi est adjacent, il est bloqué
        return areAdjacent(jailer, enemy);
    }

    private boolean areAdjacent(PieceEntity p1, PieceEntity p2) {
        int dq = Math.abs(p1.getQ() - p2.getQ());
        int dr = Math.abs(p1.getR() - p2.getR());
        int ds = Math.abs((p1.getQ()+p1.getR()) - (p2.getQ()+p2.getR()));
        return (dq + dr + ds) / 2 == 1;
    }
}