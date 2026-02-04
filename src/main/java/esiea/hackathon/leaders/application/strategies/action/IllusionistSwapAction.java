package esiea.hackathon.leaders.application.strategies.action;

import esiea.hackathon.leaders.application.strategies.ActionAbilityStrategy;
import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class IllusionistSwapAction implements ActionAbilityStrategy {

    @Override
    public String getAbilityId() {
        return "ILLUSIONIST_SWAP";
    }

    @Override
    public void execute(PieceEntity source, PieceEntity target, HexCoord dest, List<PieceEntity> allPieces) {
        if (target == null) throw new IllegalArgumentException("Target required for Swap");

        // 1. Sauvegarde position Source
        short sourceQ = source.getQ();
        short sourceR = source.getR();

        // 2. Source prend position Target
        source.setQ(target.getQ());
        source.setR(target.getR());

        // 3. Target prend position Source
        target.setQ(sourceQ);
        target.setR(sourceR);
    }
}