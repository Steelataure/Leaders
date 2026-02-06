package esiea.hackathon.leaders.application.strategies.action;

import esiea.hackathon.leaders.application.strategies.ActionAbilityStrategy;
import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.stereotype.Component;

import java.util.List;

@Component("brawlerPushAction")
public class BrawlerPushAction implements ActionAbilityStrategy {

    private static final Logger LOGGER = LogManager.getLogger(BrawlerPushAction.class);

    @Override
    public String getAbilityId() {
        return "BRAWLER_PUSH";
    }

    @Override
    public void execute(PieceEntity source, PieceEntity target, HexCoord dest, List<PieceEntity> allPieces) {
        if (target == null) {
            LOGGER.error("Échec Brawler Push : La cible est manquante.");
            throw new IllegalArgumentException("Target is required for Brawler Push");
        }
        if (dest == null) {
            LOGGER.error("Échec Brawler Push : La destination est manquante.");
            throw new IllegalArgumentException("Destination is required (where to push?)");
        }

        // 1. Vérifier que la Cible est adjacente au Cogneur
        if (getDistance(source, target) != 1) {
            LOGGER.error("Échec Brawler Push : La cible n'est pas adjacente au Cogneur.");
            throw new IllegalArgumentException("Target must be adjacent to Brawler");
        }

        // 2. Vérifier que la Destination est adjacente à la Cible (poussée d'une case)
        if (getDistance(target, dest.q(), dest.r()) != 1) {
            LOGGER.error("Échec Brawler Push : La destination n'est pas adjacente à la cible.");
            throw new IllegalArgumentException("Destination must be adjacent to the target");
        }

        // 3. Vérifier la direction "Opposée" (La règle des 3 cases arrières)
        // Sur un hexagone, si on pousse "devant" ou "sur les côtés", la distance Source->Dest est de 1.
        // Si on pousse "derrière" (les 3 cases opposées), la distance Source->Dest est de 2.
        if (getDistance(source, dest.q(), dest.r()) != 2) {
            LOGGER.error("Échec Brawler Push : La poussée doit se faire vers l'arrière.");
            throw new IllegalArgumentException("Must push target away (to one of the 3 opposite cells)");
        }

        // 4. Validations standards (Case vide et valide)
        if (!dest.isValid()) {
            LOGGER.error("Échec Brawler Push : La destination est hors du plateau.");
            throw new IllegalArgumentException("Cannot push target off the board");
        }
        if (isOccupied(dest.q(), dest.r(), allPieces)) {
            LOGGER.error("Échec Brawler Push : La case de destination est déjà occupée.");
            throw new IllegalArgumentException("Cannot push: destination cell is occupied");
        }

        // 5. APPLICATION DU MOUVEMENT
        LOGGER.info("Exécution Brawler Push : La pièce {} pousse la pièce {} vers {}", 
                    source.getId(), target.getId(), dest);

        // A. Le Cogneur prend la place de la victime
        source.setQ(target.getQ());
        source.setR(target.getR());

        // B. La Victime est propulsée sur la destination choisie
        target.setQ(dest.q());
        target.setR(dest.r());
        
        LOGGER.info("Brawler Push terminé avec succès.");
    }

    // --- Helpers ---

    private int getDistance(PieceEntity p1, PieceEntity p2) {
        return getDistance(p1, p2.getQ(), p2.getR());
    }

    private int getDistance(PieceEntity p1, int q2, int r2) {
        return (Math.abs(p1.getQ() - q2)
                + Math.abs(p1.getR() - r2)
                + Math.abs((p1.getQ() + p1.getR()) - (q2 + r2))) / 2;
    }

    private boolean isOccupied(short q, short r, List<PieceEntity> pieces) {
        return pieces.stream().anyMatch(p -> p.getQ() == q && p.getR() == r);
    }
}