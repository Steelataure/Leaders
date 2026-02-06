package esiea.hackathon.leaders.application.strategies.movement;

import esiea.hackathon.leaders.application.strategies.MoveAbilityStrategy;
import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
public class NemesisMoveStrategy implements MoveAbilityStrategy {

    private static final Logger LOGGER = LogManager.getLogger(NemesisMoveStrategy.class);

    @Override
    public String getAbilityId() {
        LOGGER.debug("Récupération de l'ID de capacité pour NemesisMoveStrategy");
        return "NEMESIS_REACT";
    }

    @Override
    public List<HexCoord> getExtraMoves(PieceEntity piece, List<PieceEntity> allPieces) {
        if (piece != null) {
            LOGGER.info("Calcul des mouvements supplémentaires pour la pièce : {}", piece.getId());
        }

        // La Némésis ne peut pas agir normalement à son tour.
        // Elle se déplace uniquement en réaction (géré ailleurs).
        
        LOGGER.warn("Tentative d'obtention de mouvements supplémentaires : la Némésis ne se déplace qu'en réaction.");
        return Collections.emptyList();
    }
}