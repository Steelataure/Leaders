package esiea.hackathon.leaders.application.services;

import esiea.hackathon.leaders.domain.model.GameEntity;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import esiea.hackathon.leaders.domain.model.RecruitmentCardEntity;
import esiea.hackathon.leaders.domain.model.RefCharacterEntity;
import esiea.hackathon.leaders.domain.model.enums.CardState;
import esiea.hackathon.leaders.domain.model.enums.GameMode;
import esiea.hackathon.leaders.domain.model.enums.GamePhase;
import esiea.hackathon.leaders.domain.model.enums.GameStatus;
import esiea.hackathon.leaders.domain.repository.GameRepository;
import esiea.hackathon.leaders.domain.repository.PieceRepository;
import esiea.hackathon.leaders.domain.repository.RecruitmentCardRepository;
import esiea.hackathon.leaders.domain.repository.RefCharacterRepository;
import lombok.RequiredArgsConstructor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GameSetupService {

    private static final Logger LOGGER = LogManager.getLogger(GameSetupService.class);

    private final GameRepository gameRepository;
    private final RefCharacterRepository characterRepository;
    private final RecruitmentCardRepository cardRepository;
    private final PieceRepository pieceRepository;

    @Transactional
    public UUID createGame(List<String> forcedDeck) { // <-- Changement de signature
        // 1. Création de l'entité (inchangé)
        LOGGER.info("Début de la création d'une nouvelle partie.");

        GameEntity game = GameEntity.builder()
                .mode(GameMode.CLASSIC)
                .phase(GamePhase.ACTION)
                .status(GameStatus.WAITING)
                .currentPlayerIndex(0)
                .turnNumber(1)
                .banishmentCount(0)
                .build();

        GameEntity savedGame = gameRepository.save(game);
        LOGGER.debug("Partie sauvegardée avec l'ID : {}", savedGame.getId());

        // 2. On passe la liste (qui peut être null) à l'initialisation
        initializeDeck(savedGame, forcedDeck);
        placeLeaders(savedGame.getId());

        LOGGER.info("Initialisation de la partie terminée avec succès.");
        return savedGame.getId();
    }

    private void initializeDeck(GameEntity game, List<String> forcedDeck) {
        // A. Liste complète de tous les personnages du jeu

        LOGGER.info("Initialisation du paquet de recrutement pour la partie {}", game.getId());

        List<String> allCharacters = new ArrayList<>(List.of(
                "ACROBAT", "ARCHER", "ASSASSIN", "BRAWLER", "CAVALRY",
                "GRAPPLER", "ILLUSIONIST", "INNKEEPER", "JAILER",
                "MANIPULATOR", "NEMESIS", "OLD_BEAR", "PROTECTOR",
                "PROWLER", "ROYAL_GUARD", "VIZIER"
        ));

        List<String> finalDeckOrder = new ArrayList<>();

        // B. Si un ordre forcé est fourni, on le traite
        if (forcedDeck != null && !forcedDeck.isEmpty()) {
            // On ajoute les cartes forcées en premier
            LOGGER.info("Application d'un ordre de deck forcé : {}", forcedDeck);
            finalDeckOrder.addAll(forcedDeck);

            // On les retire de la liste principale pour ne pas avoir de doublons
            // (La méthode removeAll gère l'égalité des Strings)
            allCharacters.removeAll(forcedDeck);
        }

        // C. On mélange ce qu'il reste (le hasard reste présent pour la fin du paquet)
        LOGGER.debug("Mélange des personnages restants.");
        Collections.shuffle(allCharacters);

        // D. On complète le deck avec le reste mélangé
        finalDeckOrder.addAll(allCharacters);

        // --- Création des entités (Inchangé) ---
        int order = 1;
        for (String charId : finalDeckOrder) {
            RefCharacterEntity character = characterRepository.findById(charId)
                    .orElseThrow(() -> {
                        LOGGER.error("Erreur critique : Personnage non trouvé en base de données : {}", charId);
                        return new RuntimeException("Character not found inside DB: " + charId);
                    });

            // Les 3 premières sont visibles
            CardState state = (order <= 3) ? CardState.VISIBLE : CardState.IN_DECK;
            Integer slot = (order <= 3) ? order : null;

            RecruitmentCardEntity card = RecruitmentCardEntity.builder()
                    .game(game)
                    .character(character)
                    .state(state)
                    .visibleSlot(slot)
                    .deckOrder(order)
                    .build();

            cardRepository.save(card);
            order++;
        }
        LOGGER.debug("Paquet de {} cartes généré et sauvegardé.", finalDeckOrder.size());
    }

    private void placeLeaders(UUID gameId) {
        // Placement du Leader Joueur 0 (En haut : 0, -3)
        LOGGER.info("Placement des chefs (Leaders) sur le plateau pour la partie {}", gameId);

        PieceEntity leaderP1 = PieceEntity.builder()
                .gameId(gameId)
                .characterId("LEADER")
                .ownerIndex((short) 0)
                .q((short) 0)
                .r((short) -3)
                .hasActedThisTurn(false)
                .build();

        // Placement du Leader Joueur 1 (En bas : 0, 3)
        PieceEntity leaderP2 = PieceEntity.builder()
                .gameId(gameId)
                .characterId("LEADER")
                .ownerIndex((short) 1)
                .q((short) 0)
                .r((short) 3)
                .hasActedThisTurn(false)
                .build();

        pieceRepository.save(leaderP1);
        pieceRepository.save(leaderP2);
        LOGGER.debug("Leaders des joueurs 0 et 1 positionnés.");
    }
}