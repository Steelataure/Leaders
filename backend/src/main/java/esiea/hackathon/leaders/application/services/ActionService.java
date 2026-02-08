package esiea.hackathon.leaders.application.services;

import esiea.hackathon.leaders.application.strategies.ActionAbilityStrategy;
import esiea.hackathon.leaders.application.strategies.action.ActionFactory;
import esiea.hackathon.leaders.application.strategies.passive.JailerBlockStrategy;
import esiea.hackathon.leaders.application.strategies.passive.PassiveFactory;
import esiea.hackathon.leaders.application.strategies.passive.ProtectorShieldStrategy;
import esiea.hackathon.leaders.domain.model.GameEntity;
import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import esiea.hackathon.leaders.domain.model.RefCharacterEntity;
import esiea.hackathon.leaders.domain.repository.GameRepository;
import esiea.hackathon.leaders.domain.repository.PieceRepository;
import esiea.hackathon.leaders.domain.repository.RefCharacterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ActionService {

    private final PieceRepository pieceRepository;
    private final RefCharacterRepository characterRepository;
    private final ActionFactory actionFactory;
    private final PassiveFactory passiveFactory;
    private final GameRepository gameRepository;

    @Transactional
    public void useAbility(UUID sourceId, UUID targetId, String abilityId, HexCoord destination, UUID playerId) {
        // 1. Chargement de la source
        PieceEntity source = pieceRepository.findById(sourceId)
                .orElseThrow(() -> new IllegalArgumentException("Source piece not found"));

        // 2. Chargement du Jeu
        GameEntity game = gameRepository.findById(source.getGameId())
                .orElseThrow(() -> new IllegalArgumentException("Game not found"));

        // 3. 🛑 SÉCURITÉ : Vérification du tour
        if (source.getOwnerIndex().intValue() != game.getCurrentPlayerIndex()) {
            System.err.println("DEBUG: Not your turn to use ability!");
            throw new IllegalStateException("Action refusée : Ce n'est pas votre tour !");
        }

        // Vérification identité
        var currentPlayer = game.getPlayers().stream()
                .filter(p -> p.getPlayerIndex() == game.getCurrentPlayerIndex())
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Current player not found in game"));

        if (playerId != null && !playerId.equals(currentPlayer.getUserId())) {
            throw new IllegalStateException("Action refusée : Vous n'êtes pas le joueur actif !");
        }

        if (source.getHasActedThisTurn()) {
            throw new IllegalArgumentException("Piece has already acted this turn");
        }

        // Vérification que le perso possède bien la compétence
        RefCharacterEntity character = characterRepository.findById(source.getCharacterId())
                .orElseThrow(() -> new IllegalStateException("Character definition not found"));

        boolean hasAbility = character.getAbilities().stream()
                .anyMatch(a -> a.getId().equals(abilityId));

        if (!hasAbility) {
            throw new IllegalArgumentException("This piece does not have the ability: " + abilityId);
        }

        // Chargement de la cible (optionnel selon l'action)
        PieceEntity target = null;
        if (targetId != null) {
            target = pieceRepository.findById(targetId)
                    .orElseThrow(() -> new IllegalArgumentException("Target piece not found"));
        }

        List<PieceEntity> allPieces = pieceRepository.findByGameId(source.getGameId());

        // --- Vérification des PASSIFS défensifs (Geôlier, Protecteur) ---
        if (isBlockedByJailer(source, allPieces)) {
            throw new IllegalStateException("Action blocked! An enemy Jailer is adjacent.");
        }

        if (target != null && !target.getOwnerIndex().equals(source.getOwnerIndex())) {
            if (isTargetProtected(target, allPieces)) {
                throw new IllegalStateException("Action blocked! The target is protected by a Shield.");
            }
        }

        // Exécution de la Stratégie via Factory
        ActionAbilityStrategy strategy = actionFactory.getStrategy(abilityId);
        System.out.println("DEBUG: Executing strategy " + abilityId);
        if (strategy == null) {
            throw new IllegalArgumentException("No implementation found for ability: " + abilityId);
        }

        strategy.execute(source, target, destination, allPieces);

        // Validation de l'action
        source.setHasActedThisTurn(true);
        pieceRepository.save(source);

        if (target != null) {
            pieceRepository.save(target);
        }
    }

    // --- Helpers Passifs ---

    private boolean isBlockedByJailer(PieceEntity me, List<PieceEntity> allPieces) {
        JailerBlockStrategy strategy = passiveFactory.getStrategy("JAILER_BLOCK", JailerBlockStrategy.class);
        if (strategy == null)
            return false;

        return allPieces.stream()
                .filter(p -> "JAILER".equals(p.getCharacterId()))
                .filter(p -> !p.getOwnerIndex().equals(me.getOwnerIndex())) // Ennemi
                .anyMatch(jailer -> strategy.isBlocking(jailer, me));
    }

    private boolean isTargetProtected(PieceEntity target, List<PieceEntity> allPieces) {
        ProtectorShieldStrategy strategy = passiveFactory.getStrategy("PROTECTOR_SHIELD",
                ProtectorShieldStrategy.class);
        if (strategy == null)
            return false;

        return allPieces.stream()
                .filter(p -> "PROTECTOR".equals(p.getCharacterId()))
                .filter(p -> p.getOwnerIndex().equals(target.getOwnerIndex())) // Allié de la cible
                .anyMatch(protector -> strategy.isProtecting(protector, target));
    }
}