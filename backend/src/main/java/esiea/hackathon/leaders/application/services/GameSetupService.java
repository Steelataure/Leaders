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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GameSetupService {

    private final GameRepository gameRepository;
    private final RefCharacterRepository characterRepository;
    private final RecruitmentCardRepository cardRepository;
    private final PieceRepository pieceRepository;

    @Transactional
    public UUID createGame(List<String> forcedDeck) {
        return createGameWithId(UUID.randomUUID(), forcedDeck);
    }

    @Transactional
    public UUID createGameWithId(UUID gameId, List<String> forcedDeck) {
        try {
            System.out.println("DEBUG: Starting createGameWithId for " + gameId);
            GameEntity game = GameEntity.builder()
                    .id(gameId)
                    .mode(GameMode.CLASSIC)
                    .phase(GamePhase.ACTION)
                    .status(GameStatus.IN_PROGRESS)
                    .currentPlayerIndex(0)
                    .turnNumber(1)
                    .banishmentCount(0)
                    .build();

            GameEntity savedGame = gameRepository.save(game);
            System.out.println("DEBUG: Game entity saved");

            initializeDeck(savedGame, forcedDeck);
            System.out.println("DEBUG: Deck initialized");

            placeLeaders(savedGame.getId());
            System.out.println("DEBUG: Leaders placed");

            return savedGame.getId();
        } catch (Exception e) {
            System.err.println("CRITICAL ERROR in createGameWithId: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    private void initializeDeck(GameEntity game, List<String> forcedDeck) {
        // A. Liste complète de tous les personnages du jeu
        List<String> allCharacters = new ArrayList<>(List.of(
                "ACROBAT", "ARCHER", "ASSASSIN", "BRAWLER", "CAVALRY",
                "GRAPPLER", "ILLUSIONIST", "INNKEEPER", "JAILER",
                "MANIPULATOR", "NEMESIS", "OLD_BEAR", "PROTECTOR",
                "PROWLER", "ROYAL_GUARD", "VIZIER"));

        List<String> finalDeckOrder = new ArrayList<>();

        // B. Si un ordre forcé est fourni, on le traite
        if (forcedDeck != null && !forcedDeck.isEmpty()) {
            // On ajoute les cartes forcées en premier
            finalDeckOrder.addAll(forcedDeck);

            // On les retire de la liste principale pour ne pas avoir de doublons
            // (La méthode removeAll gère l'égalité des Strings)
            allCharacters.removeAll(forcedDeck);
        }

        // C. On mélange ce qu'il reste (le hasard reste présent pour la fin du paquet)
        Collections.shuffle(allCharacters);

        // D. On complète le deck avec le reste mélangé
        finalDeckOrder.addAll(allCharacters);

        // --- Création des entités (Inchangé) ---
        int order = 1;
        for (String charId : finalDeckOrder) {
            RefCharacterEntity character = characterRepository.findById(charId)
                    .orElseThrow(() -> new RuntimeException("Character not found inside DB: " + charId));

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
    }

    private void placeLeaders(UUID gameId) {
        // Placement du Leader Joueur 0 (En haut : 0, -3)
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
    }
}