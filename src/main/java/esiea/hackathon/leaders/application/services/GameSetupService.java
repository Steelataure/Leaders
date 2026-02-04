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
    public UUID createGame() {
        // 1. Créer l'entité Jeu en forçant TOUTES les valeurs
        // Cela empêche Hibernate d'envoyer des NULL qui violent les contraintes SQL
        GameEntity game = GameEntity.builder()
                .mode(GameMode.CLASSIC)
                .phase(GamePhase.ACTION)
                .status(GameStatus.WAITING)
                .currentPlayerIndex(0) // int
                .turnNumber(1)         // int
                .banishmentCount(0)    // int
                // On ne met PAS d'ID ici, on laisse le Repository le gérer lors du save
                .build();

        // 2. Sauvegarder pour obtenir l'instance gérée par JPA (avec son ID)
        GameEntity savedGame = gameRepository.save(game);

        // 3. Initialiser le reste avec l'objet sauvegardé
        initializeDeck(savedGame);
        placeLeaders(savedGame.getId());

        return savedGame.getId();
    }

    private void initializeDeck(GameEntity game) {
        // Liste des IDs en ANGLAIS (correspondant exactement à ton fichier schema.sql)
        List<String> deckCharacterIds = List.of(
                "ACROBAT", "ARCHER", "ASSASSIN", "BRAWLER", "CAVALRY",
                "GRAPPLER", "ILLUSIONIST", "INNKEEPER", "JAILER",
                "MANIPULATOR", "NEMESIS", "OLD_BEAR", "PROTECTOR",
                "PROWLER", "ROYAL_GUARD", "VIZIER"
        );

        // Mélange aléatoire
        List<String> shuffledIds = new ArrayList<>(deckCharacterIds);
        Collections.shuffle(shuffledIds);

        int order = 1;
        for (String charId : shuffledIds) {
            RefCharacterEntity character = characterRepository.findById(charId)
                    .orElseThrow(() -> new RuntimeException("Character not found inside DB: " + charId));

            // Les 3 premières cartes vont dans la rivière (VISIBLE), les autres dans la pioche
            CardState state = (order <= 3) ? CardState.VISIBLE : CardState.IN_DECK;
            Integer slot = (order <= 3) ? order : null;

            RecruitmentCardEntity card = RecruitmentCardEntity.builder()
                    .game(game) // On lie à la partie créée
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