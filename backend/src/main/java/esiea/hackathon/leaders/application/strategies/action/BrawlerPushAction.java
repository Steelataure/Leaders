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

        try {
            String logMsg = String.format(
                    "DEBUG: BrawlerPushAction source=(%d,%d) target=(%d,%d) dest=(%d,%d) secDest=(%d,%d)\n",
                    source.getQ(), source.getR(), target.getQ(), target.getR(), dest.q(), dest.r(),
                    secondaryDestination.q(), secondaryDestination.r());
            java.nio.file.Files.write(java.nio.file.Paths.get("brawler_debug.log"), logMsg.getBytes(),
                    java.nio.file.StandardOpenOption.CREATE, java.nio.file.StandardOpenOption.APPEND);
        } catch (Exception e) {
        }

        // PROTECTION CHECK: Cannot move a protected piece
        if (HexUtils.isProtected(target, allPieces)) {
            throw new IllegalArgumentException("Target is protected by a Protector's aura!");
        }

        HexCoord sourceCoord = new HexCoord(source.getQ(), source.getR());
        HexCoord targetCoord = new HexCoord(target.getQ(), target.getR());

        // 1. Le Cogneur doit être à portée (dist 1 ou 2)
        if (HexUtils.getDistance(sourceCoord, targetCoord) > 2) {
            throw new IllegalArgumentException("Target is too far for Brawler Push (max distance 2)");
        }

        // 2. Le Cogneur prend la place de l'ennemi (dest doit être targetCoord)
        if (!dest.equals(targetCoord)) {
            throw new IllegalArgumentException("Brawler must land on the target's position");
        }

        // 3. La case de poussée (secondaryDestination) doit être adjacente à la cible
        if (HexUtils.getDistance(targetCoord, secondaryDestination) != 1) {
            throw new IllegalArgumentException("Push destination must be adjacent to the target's current position");
        }

        // 4. Case de poussée doit être VIDE et VALIDE
        if (!secondaryDestination.isValid()) {
            throw new IllegalArgumentException("Push destination is off-board");
        }
        if (HexUtils.isOccupied(secondaryDestination, allPieces)) {
            throw new IllegalArgumentException("Push destination cell is occupied");
        }

        // 6. APPLICATION DU MOUVEMENT
        // A. La Victime est propulsée sur la case choisie AVANT que le Cogneur ne
        // prenne sa place
        // pour éviter tout conflit de position dans l'état intermédiaire si nécessaire
        // (Bien que ici on mette à jour les objets en mémoire)
        target.setQ(secondaryDestination.q());
        target.setR(secondaryDestination.r());

        // B. Le Cogneur prend la place de l'ennemi
        source.setQ(targetCoord.q());
        source.setR(targetCoord.r());
    }
}