package esiea.hackathon.leaders.application.strategies.movement;

import esiea.hackathon.leaders.application.strategies.MoveAbilityStrategy;
import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
public class NemesisMoveStrategy implements MoveAbilityStrategy {

    @Override
    public String getAbilityId() {
        return "NEMESIS_REACT";
    }

    @Override
    public List<HexCoord> getExtraMoves(PieceEntity piece, List<PieceEntity> allPieces) {
        // La Némésis ne peut pas agir normalement à son tour.
        // Elle se déplace uniquement en réaction (géré ailleurs).
        return Collections.emptyList();
    }
}