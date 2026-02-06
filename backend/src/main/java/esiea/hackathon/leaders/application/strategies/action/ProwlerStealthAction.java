package esiea.hackathon.leaders.application.strategies.action;

import esiea.hackathon.leaders.application.strategies.ActionAbilityStrategy;
import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.stereotype.Component;

import java.util.List;

@Component("prowlerStealthAction")
public class ProwlerStealthAction implements ActionAbilityStrategy {

    private static final Logger LOGGER = LogManager.getLogger(ProwlerStealthAction.class);

    @Override
    public String getAbilityId() {
        return "PROWLER_STEALTH";
    }

    @Override
    public void execute(PieceEntity source, PieceEntity target, HexCoord dest, List<PieceEntity> allPieces) {
        LOGGER.info("Tentative d'exécution de PROWLER_STEALTH pour la pièce ID: {} vers {}", source.getId(), dest);

        if (dest == null) {
            LOGGER.error("Échec de l'action : La destination est nulle");
            throw new IllegalArgumentException("Destination is required for Teleport");
        }

        // 1. La case doit être sur le plateau
        if (!dest.isValid()) {
            LOGGER.warn("Échec de l'action : Destination hors du plateau ({}, {})", dest.q(), dest.r());
            throw new IllegalArgumentException("Cannot teleport off the board");
        }

        // 2. La case doit être VIDE
        if (isOccupied(dest.q(), dest.r(), allPieces)) {
            LOGGER.warn("Échec de l'action : La case ({}, {}) est déjà occupée", dest.q(), dest.r());
            throw new IllegalArgumentException("Destination is occupied");
        }

        // 3. RÈGLE D'OR : Pas d'ennemi adjacent à la case d'arrivée
        boolean isUnsafe = allPieces.stream()
                // On ne regarde que les ENNEMIS
                .filter(p -> !p.getOwnerIndex().equals(source.getOwnerIndex()))
                .anyMatch(enemy -> areAdjacent(dest.q(), dest.r(), enemy.getQ(), enemy.getR()));

        if (isUnsafe) {
            LOGGER.warn("Échec de l'action : Présence d'un ennemi adjacent à la destination ({}, {})", dest.q(), dest.r());
            throw new IllegalArgumentException("Cannot teleport adjacent to an enemy!");
        }

        // 4. Téléportation
        source.setQ(dest.q());
        source.setR(dest.r());
        LOGGER.info("Téléportation réussie pour la pièce ID: {} vers ({}, {})", source.getId(), dest.q(), dest.r());
    }

    // --- Helpers ---
    private boolean isOccupied(short q, short r, List<PieceEntity> pieces) {
        return pieces.stream().anyMatch(p -> p.getQ() == q && p.getR() == r);
    }

    private boolean areAdjacent(int q1, int r1, int q2, int r2) {
        int dist = (Math.abs(q1 - q2) + Math.abs(r1 - r2) + Math.abs((q1 + r1) - (q2 + r2))) / 2;
        return dist == 1;
    }
}