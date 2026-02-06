package esiea.hackathon.leaders.application.strategies.action;

import esiea.hackathon.leaders.application.strategies.ActionAbilityStrategy;
import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import org.springframework.stereotype.Component;

import java.util.List;

@Component("acrobatJumpAction")
public class AcrobatJumpAction implements ActionAbilityStrategy {

    @Override
    public String getAbilityId() {
        return "ACROBAT_JUMP";
    }

    @Override
    public void execute(PieceEntity source, PieceEntity target, HexCoord dest, List<PieceEntity> allPieces) {
        if (target == null) {
            throw new IllegalArgumentException("Target to jump over is required");
        }

        // 1. Vérifier que la cible est ADJACENTE
        if (!isAdjacent(source, target)) {
            throw new IllegalArgumentException("Can only jump over adjacent pieces");
        }

        // 2. Calculer la case d'atterrissage (Derrière la cible)
        int dq = target.getQ() - source.getQ();
        int dr = target.getR() - source.getR();

        short landQ = (short) (target.getQ() + dq);
        short landR = (short) (target.getR() + dr);

        // 3. Vérifications
        if (!isValidHex(landQ, landR)) {
            throw new IllegalArgumentException("Cannot jump off the board");
        }
        if (isOccupied(landQ, landR, allPieces)) {
            throw new IllegalArgumentException("Landing spot is occupied");
        }

        // 4. EXECUTION
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