package esiea.hackathon.leaders.application.strategies.action;

import esiea.hackathon.leaders.application.strategies.ActionAbilityStrategy;
import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import org.springframework.stereotype.Component;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import java.util.List;

@Component("manipulatorAction")
public class ManipulatorAction implements ActionAbilityStrategy {

    private static final Logger LOGGER = LogManager.getLogger(ManipulatorAction.class);

    @Override
    public String getAbilityId() { return "MANIPULATOR_MOVE"; }

    @Override
    public void execute(PieceEntity source, PieceEntity target, HexCoord destination, List<PieceEntity> allPieces) {
        LOGGER.info("Tentative d'exécution de la capacité MANIPULATOR_MOVE par l'entité {} vers la cible {}", source.getId(), (target != null ? target.getId() : "null"));

        if (target == null || destination == null) {
            LOGGER.error("Échec de l'action : Cible ou destination manquante.");
            throw new IllegalArgumentException("Target and Destination required");
        }

        if (target.getOwnerIndex().equals(source.getOwnerIndex())) {
            LOGGER.warn("Action refusée : Le manipulateur ne peut déplacer que des ennemis.");
            throw new IllegalArgumentException("Manipulator can only move enemies");
        }

        // RÈGLE 1 : Source <-> Cible doit être Non-Adjacent et Visible
        if (getDistance(source, target) <= 1) {
            LOGGER.warn("Action refusée : La cible est adjacente au manipulateur (Distance : {}).", getDistance(source, target));
            throw new IllegalArgumentException("Target must be non-adjacent to Manipulator");
        }
        if (!isInLineOfSight(source, target)) {
            LOGGER.warn("Action refusée : La cible n'est pas en ligne de vue.");
            throw new IllegalArgumentException("Target must be visible to Manipulator");
        }

        // RÈGLE 2 : Cible <-> Destination doit être Adjacent (1 case)
        if (getDistance(target, destination.q(), destination.r()) != 1) {
            LOGGER.warn("Action refusée : La destination n'est pas adjacente à la cible.");
            throw new IllegalArgumentException("Destination must be adjacent to the target");
        }

        if (isOccupied(destination.q(), destination.r(), allPieces)) {
            LOGGER.warn("Action refusée : La destination ({}, {}) est déjà occupée.", destination.q(), destination.r());
            throw new IllegalArgumentException("Destination is occupied");
        }

        LOGGER.info("Déplacement réussi : Cible {} déplacée de ({}, {}) vers ({}, {})", 
            target.getId(), target.getQ(), target.getR(), destination.q(), destination.r());
            
        target.setQ(destination.q());
        target.setR(destination.r());
    }

    // Helpers identiques (tu peux aussi les mettre dans une classe utilitaire HexUtil)
    private int getDistance(PieceEntity p1, PieceEntity p2) {
        return (Math.abs(p1.getQ() - p2.getQ()) + Math.abs(p1.getR() - p2.getR()) + Math.abs((p1.getQ() + p1.getR()) - (p2.getQ() + p2.getR()))) / 2;
    }
    private int getDistance(PieceEntity p1, int q2, int r2) {
        return (Math.abs(p1.getQ() - q2) + Math.abs(p1.getR() - r2) + Math.abs((p1.getQ() + p1.getR()) - (q2 + r2))) / 2;
    }
    private boolean isInLineOfSight(PieceEntity p1, PieceEntity p2) {
        return p1.getQ() == p2.getQ() || p1.getR() == p2.getR() || (p1.getQ() + p1.getR()) == (p2.getQ() + p2.getR());
    }
    private boolean isOccupied(short q, short r, List<PieceEntity> pieces) {
        return pieces.stream().anyMatch(p -> p.getQ() == q && p.getR() == r);
    }
}