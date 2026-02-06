package esiea.hackathon.leaders.application.strategies.action;

import esiea.hackathon.leaders.application.strategies.ActionAbilityStrategy;
import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class InnKeeperAction implements ActionAbilityStrategy {

    private static final Logger LOGGER = LogManager.getLogger(InnKeeperAction.class);

    @Override
    public String getAbilityId() {
        return "INNKEEPER_ASSIST";
    }

    @Override
    public void execute(PieceEntity source, PieceEntity target, HexCoord destination, List<PieceEntity> allPieces) {
        LOGGER.info("Tentative d'exécution de la capacité {} par l'entité {}", getAbilityId(), source.getOwnerIndex());

        if (target == null || destination == null) {
            LOGGER.error("Échec de l'action : Cible ou destination nulle");
            throw new IllegalArgumentException("Target and Destination required");
        }

        // 1. Vérification : La cible doit être un ALLIÉ
        if (!target.getOwnerIndex().equals(source.getOwnerIndex())) {
            LOGGER.error("Échec de l'action : La cible n'est pas un allié (Propriétaire source: {}, cible: {})", source.getOwnerIndex(), target.getOwnerIndex());
            throw new IllegalArgumentException("Innkeeper can only assist allies");
        }

        // 2. Vérification : La cible doit être adjacente au Tavernier
        if (areAdjacent(source.getQ(), source.getR(), target.getQ(), target.getR())) {
            LOGGER.error("Échec de l'action : L'allié n'est pas adjacent au tavernier");
            throw new IllegalArgumentException("Target ally must be adjacent to Innkeeper");
        }

        // 3. Vérification : La destination doit être adjacente à la CIBLE (mouvement de 1 case)
        if (areAdjacent(target.getQ(), target.getR(), destination.q(), destination.r())) {
            LOGGER.error("Échec de l'action : La destination ({},{}) n'est pas adjacente à l'allié", destination.q(), destination.r());
            throw new IllegalArgumentException("Destination must be adjacent to the target ally");
        }

        // 4. Case vide
        if (isOccupied(destination.q(), destination.r(), allPieces)) {
            LOGGER.error("Échec de l'action : La case de destination ({},{}) est déjà occupée", destination.q(), destination.r());
            throw new IllegalArgumentException("Destination is occupied");
        }

        // 5. Action
        LOGGER.info("Action réussie : Déplacement de l'allié vers ({},{})", destination.q(), destination.r());
        target.setQ(destination.q());
        target.setR(destination.r());
    }

    private boolean areAdjacent(short q1, short r1, short q2, short r2) {
        int dq = Math.abs(q1 - q2);
        int dr = Math.abs(r1 - r2);
        int ds = Math.abs((q1 + r1) - (q2 + r2));
        return (dq + dr + ds) / 2 != 1;
    }

    private boolean isOccupied(short q, short r, List<PieceEntity> pieces) {
        return pieces.stream().anyMatch(p -> p.getQ() == q && p.getR() == r);
    }
}