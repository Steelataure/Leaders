package esiea.hackathon.leaders.application.strategies.action;

import esiea.hackathon.leaders.application.strategies.ActionAbilityStrategy;
import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import org.springframework.stereotype.Component;

import esiea.hackathon.leaders.domain.utils.HexUtils;
import java.util.List;

@Component("brawlerPushAction")
public class BrawlerPushAction implements ActionAbilityStrategy {

    @Override
    public String getAbilityId() {
        return "BRAWLER_PUSH";
    }

    @Override
    public void execute(PieceEntity source, PieceEntity target, HexCoord dest, List<PieceEntity> allPieces) {
        if (target == null)
            throw new IllegalArgumentException("Target is required for Brawler Push");
        if (dest == null)
            throw new IllegalArgumentException("Destination is required (where to push?)");

        HexCoord sourceCoord = new HexCoord(source.getQ(), source.getR());
        HexCoord targetCoord = new HexCoord(target.getQ(), target.getR());

        // 1. Vérifier que la Cible est adjacente au Cogneur
        if (HexUtils.getDistance(sourceCoord, targetCoord) != 1) {
            throw new IllegalArgumentException("Target must be adjacent to Brawler");
        }

        // 2. Vérifier que la Destination est adjacente à la Cible (poussée d'une case)
        if (HexUtils.getDistance(target.getQ(), target.getR(), dest.q(), dest.r()) != 1) {
            throw new IllegalArgumentException("Destination must be adjacent to the target");
        }

        // 3. Vérifier la direction "Opposée" (Straight Line Push)
        // La case de destination doit être alignée avec Source -> Target
        // Et s'éloigner de la Source.
        // Donc: Dest - Source = 2 * (Target - Source)
        // En vecteur : (destQ - srcQ) sous-entend alignement.

        // Plus simple avec HexUtils : la distance Source -> Dest doit être de 2.
        // Et il faut être aligné.
        if (HexUtils.getDistance(sourceCoord, dest) != 2 || !HexUtils.isAligned(sourceCoord, dest)) {
            throw new IllegalArgumentException("Must push target straight away (linear push)");
        }

        // 4. Validations standards (Case vide et valide)
        if (!dest.isValid()) {
            throw new IllegalArgumentException("Cannot push target off the board");
        }
        if (HexUtils.isOccupied(dest, allPieces)) {
            throw new IllegalArgumentException("Cannot push: destination cell is occupied");
        }

        // 5. APPLICATION DU MOUVEMENT

        // A. Le Cogneur prend la place de la victime
        source.setQ(target.getQ());
        source.setR(target.getR());

        // B. La Victime est propulsée sur la destination choisie
        target.setQ(dest.q());
        target.setR(dest.r());
    }
}