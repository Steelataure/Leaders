package esiea.hackathon.leaders.application.strategies.movement;

import esiea.hackathon.leaders.application.strategies.MoveAbilityStrategy;
import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Component
public class LeaderBoostStrategy implements MoveAbilityStrategy {

    @Override
    public String getAbilityId() {
        return "VIZIER_BOOST";
    }

    @Override
    public List<HexCoord> getExtraMoves(PieceEntity piece, List<PieceEntity> allPieces) {
        // 1. Sécurité : Cette logique ne s'applique qu'au LEADER
        if (!"LEADER".equals(piece.getCharacterId())) {
            return Collections.emptyList();
        }

        // 2. Vérifier la présence d'un VIZIR allié sur le plateau
        boolean hasVizierAlly = allPieces.stream()
                .anyMatch(p -> "VIZIER".equals(p.getCharacterId())
                        && p.getOwnerIndex().equals(piece.getOwnerIndex()));

        if (!hasVizierAlly) {
            return Collections.emptyList();
        }

        // 3. Calculer les cases à distance 2 ACCESSIBLES (Chemin libre)
        List<HexCoord> moves = new ArrayList<>();
        int q1 = piece.getQ();
        int r1 = piece.getR();

        // On cherche toutes les cases à distance 2
        for (int dq = -2; dq <= 2; dq++) {
            for (int dr = -2; dr <= 2; dr++) {
                if ((Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2 == 2) {
                    short targetQ = (short) (q1 + dq);
                    short targetR = (short) (r1 + dr);
                    HexCoord target = new HexCoord(targetQ, targetR);

                    // La case cible doit être valid et vide
                    if (target.isValid() && isFree(target, allPieces)) {
                        // VERIFICATION DU CHEMIN : Existe-t-il une case intermédiaire libre ?
                        if (hasPathTo(q1, r1, targetQ, targetR, allPieces)) {
                            moves.add(target);
                        }
                    }
                }
            }
        }
        return moves;
    }

    // Vérifie si une des cases adjacentes communes est libre pour passer
    private boolean hasPathTo(int startQ, int startR, int destQ, int destR, List<PieceEntity> allPieces) {
        // Les cases intermédiaires sont les voisins communs à Start et Dest
        // Pour distance 2, il y a exactement 1 case intermédiaire si c'est une ligne
        // droite,
        // ou 2 voisins communs si c'est un "coin".

        // On teste tous les voisins de Start
        int[][] directions = {
                { 1, 0 }, { -1, 0 }, { 0, 1 }, { 0, -1 }, { 1, -1 }, { -1, 1 }
        };

        for (int[] dir : directions) {
            int midQ = startQ + dir[0];
            int midR = startR + dir[1];

            // Si ce voisin est adjacent à la destination
            if (areAdjacent(midQ, midR, destQ, destR)) {
                // Et qu'il est libre
                HexCoord mid = new HexCoord((short) midQ, (short) midR);
                if (mid.isValid() && isFree(mid, allPieces)) {
                    return true; // Chemin trouvé
                }
            }
        }
        return false;
    }

    private boolean areAdjacent(int q1, int r1, int q2, int r2) {
        return (Math.abs(q1 - q2) + Math.abs(r1 - r2) + Math.abs(q1 + r1 - (q2 + r2))) / 2 == 1;
    }

    private boolean isFree(HexCoord coord, List<PieceEntity> pieces) {
        return pieces.stream().noneMatch(p -> p.getQ() == coord.q() && p.getR() == coord.r());
    }
}