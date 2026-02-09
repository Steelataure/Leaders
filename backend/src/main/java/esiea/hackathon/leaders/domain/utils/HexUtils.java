package esiea.hackathon.leaders.domain.utils;

import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;

import java.util.List;

public class HexUtils {

    public static int getDistance(HexCoord a, HexCoord b) {
        return getDistance(a.q(), a.r(), b.q(), b.r());
    }

    public static int getDistance(int q1, int r1, int q2, int r2) {
        return (Math.abs(q1 - q2) + Math.abs(r1 - r2) + Math.abs((q1 + r1) - (q2 + r2))) / 2;
    }

    public static boolean isAligned(HexCoord a, HexCoord b) {
        return a.q() == b.q() || a.r() == b.r() || (a.q() + a.r()) == (b.q() + b.r());
    }

    public static boolean isPathClear(HexCoord start, HexCoord end, List<PieceEntity> allPieces) {
        if (!isAligned(start, end))
            return false;

        int dist = getDistance(start, end);
        if (dist <= 1)
            return true; // Adjacents are always visible

        int dq = end.q() - start.q();
        int dr = end.r() - start.r();

        // Unit direction
        int stepQ = dq == 0 ? 0 : dq / dist;
        int stepR = dr == 0 ? 0 : dr / dist;

        // Check strict interpolation (should prevent floating point issues as we use
        // hex int coords)
        // But for hex grids, if aligned on axis, dq/dist or dr/dist should be -1, 0, or
        // 1 precisely.
        // Let's verify manual consistency.
        // On Q axis: dq=0. stepQ=0.
        // On R axis: dr=0. stepR=0.
        // On S axis: dq = -dr. stepQ = -stepR.

        // Check all intermediate cells
        for (int i = 1; i < dist; i++) {
            short nextQ = (short) (start.q() + stepQ * i);
            short nextR = (short) (start.r() + stepR * i);

            if (isOccupied(nextQ, nextR, allPieces)) {
                return false;
            }
        }
        return true;
    }

    public static boolean isOccupied(short q, short r, List<PieceEntity> pieces) {
        return pieces.stream().anyMatch(p -> p.getQ() == q && p.getR() == r);
    }

    public static boolean isOccupied(HexCoord coord, List<PieceEntity> pieces) {
        return isOccupied(coord.q(), coord.r(), pieces);
    }

    public static boolean isProtected(PieceEntity target, List<PieceEntity> allPieces) {
        // Le Protecteur lui-même n'est pas "protégé" contre le déplacement forcé par sa
        // propre aura,
        // MAIS la règle dit "sur lui-même et ses alliés".
        // Donc si target EST un PROTECTOR, il est protégé.
        if ("PROTECTOR".equals(target.getCharacterId())) {
            return true;
        }

        // Sinon, chercher un PROTECTOR allié adjacent
        return allPieces.stream()
                .filter(p -> p.getOwnerIndex().equals(target.getOwnerIndex())) // Allié
                .filter(p -> "PROTECTOR".equals(p.getCharacterId())) // Est un Protecteur
                .anyMatch(p -> getDistance(p.getQ(), p.getR(), target.getQ(), target.getR()) == 1); // Adjacent
    }
}
