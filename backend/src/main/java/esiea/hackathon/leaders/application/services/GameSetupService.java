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
    public UUID createGame(List<String> forcedDeck, Integer scenarioId) {
        return createGameWithId(UUID.randomUUID(), forcedDeck, scenarioId);
    }

    @Transactional
    public UUID createGameWithId(UUID gameId, List<String> forcedDeck, Integer scenarioId) {
        try {
            System.out.println("DEBUG: Starting createGameWithId for " + gameId + " with scenario " + scenarioId);
            GameEntity game = GameEntity.builder()
                    .id(gameId)
                    .mode(GameMode.CLASSIC)
                    .phase(GamePhase.ACTION)
                    .status(GameStatus.IN_PROGRESS)
                    .currentPlayerIndex(0)
                    .turnNumber(1)
                    .banishmentCount(0)
                    .remainingTimeP0(420)
                    .remainingTimeP1(420)
                    .lastTimerUpdate(java.time.LocalDateTime.now())
                    .build();

            GameEntity savedGame = gameRepository.save(game);
            System.out.println("DEBUG: Game entity saved");

            initializeDeck(savedGame, forcedDeck, scenarioId);
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

    private void initializeDeck(GameEntity game, List<String> forcedDeck, Integer scenarioId) {
        // A. Liste des personnages à inclure dans le deck
        List<String> allCharacters;

        if (scenarioId != null) {
            // Fetch characters for this specific scenario
            allCharacters = characterRepository.findByScenarioId(scenarioId).stream()
                    .filter(c -> c.getRecruitmentSlots() > 0) // Exclure l'Ourson (Slots=0) et les compagnons futurs
                    .map(RefCharacterEntity::getId)
                    .filter(id -> !"LEADER".equals(id)) // Le leader est déjà placé
                    .collect(java.util.stream.Collectors.toList());
            System.out.println("DEBUG: Using scenario " + scenarioId + " characters: " + allCharacters);
        } else {
            // Fallback to all characters if no scenario (LEGACY / DEFAULT)
            allCharacters = new ArrayList<>(List.of(
                    "ACROBAT", "ARCHER", "ASSASSIN", "BRAWLER", "CAVALRY",
                    "GRAPPLER", "ILLUSIONIST", "INNKEEPER", "JAILER",
                    "MANIPULATOR", "NEMESIS", "PROTECTOR",
                    "PROWLER", "ROYAL_GUARD", "VIZIER", "OLD_BEAR"));
        }

        List<String> finalDeckOrder = new ArrayList<>();

        // B. Si un ordre forcé est fourni, on le traite
        if (forcedDeck != null && !forcedDeck.isEmpty()) {
            finalDeckOrder.addAll(forcedDeck);
            allCharacters.removeAll(forcedDeck);
        }

        // C. On mélange ce qu'il reste
        Collections.shuffle(allCharacters);

        // D. On complète le deck
        finalDeckOrder.addAll(allCharacters);

        // --- Création des entités ---
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
        // Placement du Leader Joueur 0 (BLEU) -> MAINTENANT EN BAS (0, 3)
        PieceEntity leaderP1 = PieceEntity.builder()
                .gameId(gameId)
                .characterId("LEADER")
                .ownerIndex((short) 0)
                .q((short) 0)
                .r((short) 3)
                .hasActedThisTurn(false)
                .build();

        // Placement du Leader Joueur 1 (ROUGE) -> MAINTENANT EN HAUT (0, -3)
        PieceEntity leaderP2 = PieceEntity.builder()
                .gameId(gameId)
                .characterId("LEADER")
                .ownerIndex((short) 1)
                .q((short) 0)
                .r((short) -3)
                .hasActedThisTurn(false)
                .build();

        pieceRepository.save(leaderP1);
        pieceRepository.save(leaderP2);
    }
}