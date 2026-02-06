package esiea.hackathon.leaders.application.strategies.action;

import esiea.hackathon.leaders.application.strategies.ActionAbilityStrategy;
import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.stereotype.Component;

import java.util.List;

@Component("cavalryChargeAction")
public class CavalryChargeAction implements ActionAbilityStrategy {

    private static final Logger LOGGER = LogManager.getLogger(CavalryChargeAction.class);

    @Override
    public String getAbilityId() {
        return "CAVALRY_CHARGE";
    }

    @Override
    public void execute(PieceEntity source, PieceEntity target, HexCoord dest, List<PieceEntity> allPieces) {
        if (dest == null) {
            LOGGER.error("Échec de la charge : La destination est nulle.");
            throw new IllegalArgumentException("Destination is required for Charge");
        }

        // 1. Calcul du vecteur (Destination - Source)
        int dq = dest.q() - source.getQ();
        int dr = dest.r() - source.getR();
        int ds = -dq - dr;

        // 2. Vérification de la LIGNE DROITE (Une des coord doit être 0)
        if (dq != 0 && dr != 0 && ds != 0) {
            LOGGER.error("Échec de la charge : La trajectoire n'est pas une ligne droite (dq:{}, dr:{}, ds:{}).", dq, dr, ds);
            throw new IllegalArgumentException("Cavalry must charge in a straight line");
        }

        // 3. Vérification de la DISTANCE (Doit être exactement 2)
        int distance = (Math.abs(dq) + Math.abs(dr) + Math.abs(ds)) / 2;
        if (distance != 2) {
            LOGGER.error("Échec de la charge : Distance invalide ({} au lieu de 2).", distance);
            throw new IllegalArgumentException("Cavalry must move exactly 2 spaces");
        }

        // 4. Vérification que la case d'arrivée est vide
        if (isOccupied(dest.q(), dest.r(), allPieces)) {
            LOGGER.error("Échec de la charge : La destination ({}, {}) est occupée.", dest.q(), dest.r());
            throw new IllegalArgumentException("Destination is occupied");
        }

        // 5. Vérification du CHEMIN (Pas de saut, case intermédiaire vide)
        int midQ = source.getQ() + (dq / 2);
        int midR = source.getR() + (dr / 2);

        if (isOccupied((short) midQ, (short) midR, allPieces)) {
            LOGGER.error("Échec de la charge : Le chemin est bloqué à la case intermédiaire ({}, {}).", midQ, midR);
            throw new IllegalArgumentException("Path is blocked (cannot jump)");
        }

        // 6. EXECUTION : Mise à jour des coordonnées
        LOGGER.info("Exécution de la charge : La pièce {} se déplace de ({}, {}) vers ({}, {}).", 
                source.getId(), source.getQ(), source.getR(), dest.q(), dest.r());
        
        source.setQ(dest.q());
        source.setR(dest.r());
    }

    private boolean isOccupied(short q, short r, List<PieceEntity> pieces) {
        return pieces.stream().anyMatch(p -> p.getQ() == q && p.getR() == r);
    }
}