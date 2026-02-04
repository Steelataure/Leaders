package esiea.hackathon.leaders.application.strategies.action;

import esiea.hackathon.leaders.application.strategies.ActionAbilityStrategy;
import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class BrawlerPushAction implements ActionAbilityStrategy {

    @Override
    public String getAbilityId() {
        return "BRAWLER_PUSH";
    }

    @Override
    public void execute(PieceEntity source, PieceEntity target, HexCoord dest, List<PieceEntity> allPieces) {
        if (target == null) throw new IllegalArgumentException("Target is required for Brawler Push");

        // 1. Calcul du vecteur de direction (Source -> Cible)
        int dq = target.getQ() - source.getQ();
        int dr = target.getR() - source.getR();

        // Vérification adjacence (le vecteur doit être de longueur 1)
        int dist = (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
        if (dist != 1) {
            throw new IllegalArgumentException("Target must be adjacent for Push");
        }

        // 2. Calcul de la case d'atterrissage (Derrière la cible)
        // On applique le même vecteur à partir de la cible
        short pushQ = (short) (target.getQ() + dq);
        short pushR = (short) (target.getR() + dr);
        HexCoord landingSpot = new HexCoord(pushQ, pushR);

        // 3. Validations
        if (!landingSpot.isValid()) {
            throw new IllegalArgumentException("Cannot push target off the board");
        }
        if (isOccupied(pushQ, pushR, allPieces)) {
            throw new IllegalArgumentException("Cannot push: landing cell is occupied");
        }

        // 4. Application du mouvement
        // La Source avance sur la case de la Cible
        source.setQ(target.getQ());
        source.setR(target.getR());

        // La Cible recule sur la case d'atterrissage
        target.setQ(pushQ);
        target.setR(pushR);
    }

    private boolean isOccupied(short q, short r, List<PieceEntity> pieces) {
        return pieces.stream().anyMatch(p -> p.getQ() == q && p.getR() == r);
    }
}