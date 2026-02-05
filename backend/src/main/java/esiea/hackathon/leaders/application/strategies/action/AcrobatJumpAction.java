package esiea.hackathon.leaders.application.strategies.action;

import esiea.hackathon.leaders.application.strategies.ActionAbilityStrategy;
import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.stereotype.Component;

import java.util.List;

@Component("acrobatJumpAction")
public class AcrobatJumpAction implements ActionAbilityStrategy {

    private static final Logger LOGGER = LogManager.getLogger(AcrobatJumpAction.class);

    @Override
    public String getAbilityId() {
        return "ACROBAT_JUMP";
    }

    @Override
    public void execute(PieceEntity source, PieceEntity target, HexCoord dest, List<PieceEntity> allPieces) {
        LOGGER.info("Tentative d'exécution de ACROBAT_JUMP pour la pièce {}", source.getId());

        if (target == null) {
            LOGGER.error("Échec du saut : la cible (target) est nulle");
            throw new IllegalArgumentException("Target to jump over is required");
        }

        // 1. Vérifier que la cible est ADJACENTE
        if (!isAdjacent(source, target)) {
            LOGGER.warn("Échec du saut : la cible n'est pas adjacente à la source");
            throw new IllegalArgumentException("Can only jump over adjacent pieces");
        }

        // 2. Calculer la case d'atterrissage (Derrière la cible)
        int dq = target.getQ() - source.getQ();
        int dr = target.getR() - source.getR();

        short landQ = (short) (target.getQ() + dq);
        short landR = (short) (target.getR() + dr);

        LOGGER.debug("Calcul de la position d'atterrissage : q={}, r={}", landQ, landR);

        // 3. Vérifications
        if (!isValidHex(landQ, landR)) {
            LOGGER.warn("Échec du saut : la position d'atterrissage ({}, {}) est hors du plateau", landQ, landR);
            throw new IllegalArgumentException("Cannot jump off the board");
        }
        if (isOccupied(landQ, landR, allPieces)) {
            LOGGER.warn("Échec du saut : la case ({}, {}) est déjà occupée", landQ, landR);
            throw new IllegalArgumentException("Landing spot is occupied");
        }

        // 4. EXECUTION
        LOGGER.info("Saut réussi : la pièce passe de ({}, {}) à ({}, {})", source.getQ(), source.getR(), landQ, landR);
        source.setQ(landQ);
        source.setR(landR);
    }

    private boolean isAdjacent(PieceEntity p1, PieceEntity p2) {
        int d = (Math.abs(p1.getQ() - p2.getQ())
                + Math.abs(p1.getR() - p2.getR())
                + Math.abs((p1.getQ() + p1.getR()) - (p2.getQ() + p2.getR()))) / 2;
        return d == 1;
    }

    private boolean isOccupied(short q, short r, List<PieceEntity> pieces) {
        return pieces.stream().anyMatch(p -> p.getQ() == q && p.getR() == r);
    }

    private boolean isValidHex(int q, int r) {
        return Math.abs(q) <= 3 && Math.abs(r) <= 3 && Math.abs(q + r) <= 3;
    }
}