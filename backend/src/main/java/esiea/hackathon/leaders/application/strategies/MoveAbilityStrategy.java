package esiea.hackathon.leaders.application.strategies;

import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import java.util.List;

public interface MoveAbilityStrategy {
    String getAbilityId();
    List<HexCoord> getExtraMoves(PieceEntity piece, List<PieceEntity> allPieces);
}