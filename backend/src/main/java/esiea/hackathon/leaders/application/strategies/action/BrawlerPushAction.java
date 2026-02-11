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
    public void execute(PieceEntity source, PieceEntity target, HexCoord dest, HexCoord secondaryDestination,
            List<PieceEntity> allPieces) {
        if (target == null)
            throw new IllegalArgumentException("Target is required for Brawler Push");
        if (dest == null)
            throw new IllegalArgumentException("Destination is required (where to land?)");
        if (secondaryDestination == null)
            throw new IllegalArgumentException("Secondary destination is required (where to push?)");

        // PROTECTION CHECK: Cannot move a protected piece
        if (HexUtils.isProtected(target, allPieces)) {
            throw new IllegalArgumentException("Target is protected by a Protector's aura!");
        }

        HexCoord sourceCoord = new HexCoord(source.getQ(), source.getR());
        HexCoord targetCoord = new HexCoord(target.getQ(), target.getR());

        // 1. Le Cogneur doit pouvoir se téléporter (dist 1 ou 2)
        if (HexUtils.getDistance(sourceCoord, targetCoord) > 2) {
            throw new IllegalArgumentException("Target is too far for Brawler Push (max distance 2)");
        }

        // 2. Vérifier que la Destination (dest) est la case où le Cogneur arrivera
        // Elle doit être adjacente à la cible
        if (HexUtils.getDistance(targetCoord, dest) != 1) {
            throw new IllegalArgumentException(
                    "Destination must be adjacent to the target (this is where Brawler lands)");
        }

        // 3. La case de poussée (secondaryDestination) doit être adjacente à la cible
        // et à l'opposé du Cogneur (souvent 3 cases possibles dans la règle)
        if (HexUtils.getDistance(targetCoord, secondaryDestination) != 1) {
            throw new IllegalArgumentException("Push destination must be adjacent to the target");
        }

        // 4. Case de poussée doit être VIDE et VALIDE
        if (!secondaryDestination.isValid()) {
            throw new IllegalArgumentException("Push destination is off-board");
        }
        if (HexUtils.isOccupied(secondaryDestination, allPieces)) {
            throw new IllegalArgumentException("Push destination cell is occupied");
        }

        // 5. Case d'arrivée du Cogneur doit être VIDE (ou sa position actuelle)
        if (!dest.isValid()) {
            throw new IllegalArgumentException("Brawler destination is off-board");
        }
        if (!dest.equals(sourceCoord) && HexUtils.isOccupied(dest, allPieces)) {
            throw new IllegalArgumentException("Brawler destination cell is occupied");
        }

        // 6. APPLICATION DU MOUVEMENT
        // A. Le Cogneur se déplace sur la case choisie (à côté de la cible)
        source.setQ(dest.q());
        source.setR(dest.r());

        // B. La Victime est propulsée sur la case choisie
        target.setQ(secondaryDestination.q());
        target.setR(secondaryDestination.r());
    }
}