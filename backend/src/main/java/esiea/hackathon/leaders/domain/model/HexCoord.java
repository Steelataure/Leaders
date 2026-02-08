package esiea.hackathon.leaders.domain.model;

public record HexCoord(short q, short r) {
    // Rayon du plateau (3 = 37 cases)
    public static final int BOARD_RADIUS = 3;

    public boolean isValid() {
        return Math.abs(q) <= BOARD_RADIUS
                && Math.abs(r) <= BOARD_RADIUS
                && Math.abs(q + r) <= BOARD_RADIUS;
    }
}