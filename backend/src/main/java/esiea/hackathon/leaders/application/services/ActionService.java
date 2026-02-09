package esiea.hackathon.leaders.application.services;

import esiea.hackathon.leaders.application.strategies.ActionAbilityStrategy;
import esiea.hackathon.leaders.application.strategies.action.ActionFactory;
import esiea.hackathon.leaders.application.strategies.action.NemesisBehavior;
import esiea.hackathon.leaders.application.strategies.passive.JailerBlockStrategy;
import esiea.hackathon.leaders.application.strategies.passive.PassiveFactory;
import esiea.hackathon.leaders.application.strategies.passive.ProtectorShieldStrategy;
import esiea.hackathon.leaders.domain.model.GameEntity;
import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import esiea.hackathon.leaders.domain.model.RefCharacterEntity;
import esiea.hackathon.leaders.domain.model.VictoryCheckResult;
import esiea.hackathon.leaders.domain.model.enums.GameStatus;
import esiea.hackathon.leaders.domain.repository.GameRepository;
import esiea.hackathon.leaders.domain.repository.PieceRepository;
import esiea.hackathon.leaders.domain.repository.RefCharacterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
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
    private final NemesisBehavior nemesisBehavior;
    private final VictoryService victoryService; // 🆕 Injection pour Scénario 7
    private final GameService gameService;

    @Transactional
    public void useAbility(UUID sourceId, UUID targetId, String abilityId, HexCoord destination, UUID playerId) {
        // 1. Chargement de la source
        PieceEntity source = pieceRepository.findById(sourceId)
                .orElseThrow(() -> new IllegalArgumentException("Source piece not found"));

        // 2. Chargement du Jeu
        GameEntity game = gameRepository.findById(source.getGameId())
                .orElseThrow(() -> new IllegalArgumentException("Game not found"));

        // 2b. Update Timer
        gameService.updateTimer(game);

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

        System.out.println("DEBUG: Piece BEFORE action: " + source.getCharacterId() + " at " + source.getQ() + ","
                + source.getR());
        strategy.execute(source, target, destination, allPieces);
        System.out.println(
                "DEBUG: Piece AFTER action: " + source.getCharacterId() + " at " + source.getQ() + "," + source.getR());

        // Validation de l'action
        source.setHasActedThisTurn(true);
        PieceEntity savedSource = pieceRepository.save(source);
        System.out.println("DEBUG: Piece AFTER save: " + savedSource.getCharacterId() + " at " + savedSource.getQ()
                + "," + savedSource.getR() + " hasActed=" + savedSource.getHasActedThisTurn());

        if (target != null) {
            pieceRepository.save(target);
        }

        // 🆕 SCÉNARIO 5 : Trigger Némésis si un Leader a été déplacé par une capacité
        // Recharger les pièces car les positions ont pu changer
        List<PieceEntity> updatedPieces = pieceRepository.findByGameId(source.getGameId());

        // Vérifier si la SOURCE est un Leader qui a bougé (ex: Illusionniste swap avec
        // Leader)
        triggerNemesisIfLeaderMoved(source, updatedPieces);

        // Vérifier si la CIBLE est un Leader qui a été déplacé (ex: Manipulatrice,
        // Grappler, Cogneur)
        if (target != null) {
            triggerNemesisIfLeaderMoved(target, updatedPieces);
        }

        // 🆕 SCÉNARIO 7 : Vérification de victoire IMMÉDIATE après chaque capacité
        // Cela permet à l'Assassin (seul) ou à l'Archère (à distance 2) de déclencher
        // la victoire
        // même si le déplacement vient d'une capacité (Illusionniste swap,
        // Manipulatrice move, etc.)
        checkAndApplyVictory(game);
    }

    /**
     * 🆕 SCÉNARIO 7 : Vérifie si une condition de victoire est remplie et termine
     * la partie si nécessaire.
     * Appelé après chaque mouvement et chaque action.
     * - Assassin adjacent au Leader = 2 points (capture solo immédiate)
     * - Archère à distance 2 du Leader = 1 point (aide à la capture)
     */
    private void checkAndApplyVictory(GameEntity game) {
        VictoryCheckResult result = victoryService.checkVictory(game.getId());

        if (result.isGameOver()) {
            game.setStatus(GameStatus.FINISHED);
            game.setWinnerPlayerIndex(result.winnerPlayerIndex());
            game.setWinnerVictoryType(result.victoryType());
            game.setUpdatedAt(LocalDateTime.now());
            gameRepository.save(game);
        }
    }

    // --- Trigger Némésis (Scénario 5) ---

    /**
     * Déclenche la réaction de la Némésis ennemie si un Leader vient de bouger.
     * La Némésis se déplace de 2 cases vers le Leader adverse.
     */
    private void triggerNemesisIfLeaderMoved(PieceEntity movedPiece, List<PieceEntity> allPieces) {
        // Seul le mouvement d'un Leader déclenche la Némésis
        if (!"LEADER".equals(movedPiece.getCharacterId())) {
            return;
        }

        // Trouver la Némésis de l'équipe adverse
        allPieces.stream()
                .filter(p -> "NEMESIS".equals(p.getCharacterId()))
                .filter(p -> !p.getOwnerIndex().equals(movedPiece.getOwnerIndex())) // Némésis ennemie
                .findFirst()
                .ifPresent(nemesis -> {
                    // La Némésis réagit et se déplace de 2 cases vers le Leader
                    nemesisBehavior.react(nemesis, movedPiece, allPieces);
                    pieceRepository.save(nemesis);
                });
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