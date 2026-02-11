package esiea.hackathon.leaders.application.strategies;

import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import java.util.List;

public interface ActionAbilityStrategy {

    String getAbilityId();

    /**
     * Exécute l'action.
     * 
     * @param source               La pièce qui utilise la compétence.
     * @param target               La pièce ciblée (peut être null selon la
     *                             compétence, mais souvent requise).
     * @param targetDestination    La case où la cible doit aller (pour
     *                             Manipulation/Assistance).
     * @param secondaryDestination Case secondaire (ex: Brawler push).
     * @param allPieces            L'état du plateau.
     */
    void execute(PieceEntity source, PieceEntity target, HexCoord targetDestination, HexCoord secondaryDestination,
            List<PieceEntity> allPieces);
}