package esiea.hackathon.leaders.application.strategies.special;

import esiea.hackathon.leaders.domain.model.PieceEntity;
import org.springframework.stereotype.Component;

@Component
public class ArcherSpecialCaptureStrategy {

    public String getAbilityId() {
        return "ARCHER_RANGE";
    }

    /**
     * Vérifie si l'archer contribue à la capture (Distance 2).
     * @param archer La pièce de l'archer
     * @param target La pièce (Leader) ciblée
     * @return true si l'archer est à distance 2 exactement
     */
    public boolean contributesToCapture(PieceEntity archer, PieceEntity target) {
        // Calcul de la distance hexagonale
        int dist = getDistance(archer, target);

        // L'Archer aide à la capture UNIQUEMENT à distance 2.
        // (S'il est adjacent/distance 1, il ne tire pas, il est au corps à corps avec des stats faibles)
        return dist == 2;
    }

    /**
     * Calcule la distance entre deux pièces sur une grille hexagonale.
     */
    private int getDistance(PieceEntity p1, PieceEntity p2) {
        return (Math.abs(p1.getQ() - p2.getQ())
                + Math.abs(p1.getR() - p2.getR())
                + Math.abs((p1.getQ() + p1.getR()) - (p2.getQ() + p2.getR()))) / 2;
    }
}