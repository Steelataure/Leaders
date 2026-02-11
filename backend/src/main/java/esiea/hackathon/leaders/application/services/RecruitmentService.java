package esiea.hackathon.leaders.application.services;

import esiea.hackathon.leaders.domain.model.GameEntity;
import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import esiea.hackathon.leaders.domain.model.RecruitmentCardEntity;
import esiea.hackathon.leaders.domain.model.enums.CardState;
import esiea.hackathon.leaders.domain.repository.GameRepository;
import esiea.hackathon.leaders.domain.repository.PieceRepository;
import esiea.hackathon.leaders.domain.repository.RecruitmentCardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RecruitmentService {

    private final RecruitmentCardRepository cardRepository;
    private final PieceRepository pieceRepository;
    private final GameRepository gameRepository;
    private final GameService gameService;

    @Transactional
    public List<PieceEntity> recruit(UUID gameId, Short playerIndex, UUID cardId, List<HexCoord> placements) {

        // 1. Chargement du Jeu
        GameEntity game = gameRepository.findById(gameId)
                .orElseThrow(() -> new IllegalArgumentException("Game not found"));

        // 1b. Update Timer
        gameService.updateTimer(game);

        if (game.getCurrentPlayerIndex() != playerIndex.intValue()) {
            throw new IllegalStateException("Action refusée : Ce n'est pas le tour du joueur " + playerIndex);
        }

        // 2a. SÉCURITÉ : Vérification que TOUTES les pièces ont agi (Phase d'actions
        // terminée)
        // EXCEPTION : La Némésis ne joue pas activement, on l'ignore.
        List<PieceEntity> playerPieces = pieceRepository.findByGameId(gameId).stream()
                .filter(p -> p.getOwnerIndex().equals(playerIndex))
                .toList();

        // RÈGLE SPÉCIALE : Vieil Ours et Ourson (Duo)
        // Pour pouvoir recruter, il faut que toutes les pièces aient agi.
        // Mais pour l'Ours et l'Ourson, la règle est "l'un ou les deux".
        // Donc si au moins l'un des deux a agi, on considère le "slot" du duo comme
        // complété
        // pour autoriser le recrutement.
        boolean bearOrCubPresent = playerPieces.stream()
                .anyMatch(p -> "OLD_BEAR".equals(p.getCharacterId()) || "CUB".equals(p.getCharacterId()));
        boolean bearOrCubActed = playerPieces.stream()
                .filter(p -> "OLD_BEAR".equals(p.getCharacterId()) || "CUB".equals(p.getCharacterId()))
                .anyMatch(PieceEntity::getHasActedThisTurn);

        boolean allPiecesActed;
        if (bearOrCubPresent) {
            // Toutes les pièces NON-OURS doivent avoir agi, ET au moins une pièce du duo
            // OURS.
            allPiecesActed = playerPieces.stream()
                    .filter(p -> !"NEMESIS".equals(p.getCharacterId()))
                    .filter(p -> !"OLD_BEAR".equals(p.getCharacterId()) && !"CUB".equals(p.getCharacterId()))
                    .allMatch(PieceEntity::getHasActedThisTurn) && bearOrCubActed;
        } else {
            // Logique standard
            allPiecesActed = playerPieces.stream()
                    .filter(p -> !"NEMESIS".equals(p.getCharacterId()))
                    .allMatch(PieceEntity::getHasActedThisTurn);
        }

        if (!allPiecesActed) {
            throw new IllegalStateException(
                    "Action refusée : Vous devez terminer vos actions (ou les passer) avant de recruter. " +
                            (bearOrCubPresent && !bearOrCubActed ? "(Règle Duo : Déplacez au moins l'Ours ou l'Ourson)"
                                    : ""));
        }

        // 2b. SÉCURITÉ : Limite de recrutement par tour
        int maxRecruitments = 1;

        // RÈGLE : Compensation 2ème joueur (Index 1) au Tour 2 (son premier tour)
        // Note sur turnNumber: J1 joue T1, J2 joue T2, J1 joue T3...
        // Donc si playerIndex == 1 (Joueur 2) et turnNumber <= 2 (son premier tour est
        // le 2eme du jeu global)
        if (playerIndex == 1 && game.getTurnNumber() <= 2) {
            maxRecruitments = 2;
        }

        if (game.getRecruitmentCount() >= maxRecruitments) {
            throw new IllegalStateException("Recrutement impossible : Vous avez atteint la limite de "
                    + maxRecruitments + " recrutement(s) pour ce tour.");
        }

        RecruitmentCardEntity card = cardRepository.findById(cardId)
                .orElseThrow(() -> new IllegalArgumentException("Card not found"));

        // 3. Validations de la carte
        if (!card.getGame().getId().equals(gameId)) {
            throw new IllegalArgumentException("Card does not belong to this game");
        }
        if (card.getState() != CardState.VISIBLE) {
            throw new IllegalArgumentException("Card is not visible in the river (State: " + card.getState() + ")");
        }

        // 3b. VALIDATION ZONE DE RECRUTEMENT (7-Cell V-shape Edge)
        List<PieceEntity> allPieces = pieceRepository.findByGameId(gameId);

        for (HexCoord pos : placements) {
            int q = pos.q();
            int r = pos.r();

            // Vérifier si la case est déjà occupée (Correction Bug: Case occupée)
            boolean occupied = allPieces.stream().anyMatch(p -> p.getQ() == q && p.getR() == r);
            if (occupied) {
                throw new IllegalStateException("Action refusée : La case (" + q + ", " + r + ") est déjà occupée.");
            }

            boolean valid = false;
            if (playerIndex == 0) {
                // P0 (Bas/Bleu) : Leader at (0,3). Bordures r=3 et q+r=3
                if ((r == 3 && q <= 0 && q >= -3) || (q + r == 3 && q >= 0 && q <= 3)) {
                    valid = true;
                }
            } else {
                // P1 (Haut/Rouge) : Leader at (0,-3). Bordures r=-3 et q+r=-3
                if ((r == -3 && q >= 0 && q <= 3) || (q + r == -3 && q <= 0 && q >= -3)) {
                    valid = true;
                }
            }

            if (!valid) {
                throw new IllegalArgumentException(
                        "Invalid recruitment zone for Player " + playerIndex + " at (" + q + ", " + r
                                + "). Must be on the board edges meeting at the Leader spawn.");
            }
        }

        // ==================================================================================
        // 4. 👇 VERIFICATION DE LA LIMITE (Max 5 pièces) - AJOUT IMPORTANT 👇
        // ==================================================================================

        // A. Combien de pièces le joueur possède-t-il DÉJÀ sur le plateau ?
        String characterId = card.getCharacter().getId();
        List<PieceEntity> allPiecesInGame = pieceRepository.findByGameId(gameId);
        System.out.println("DEBUG: Recruitment check for player " + playerIndex);

        List<PieceEntity> ownedUnits = allPiecesInGame.stream()
                .filter(p -> p.getOwnerIndex().intValue() == playerIndex.intValue())
                .peek(p -> System.out.println(
                        "DEBUG: Found piece " + p.getCharacterId() + " at (" + p.getQ() + "," + p.getR() + ")"))
                .filter(p -> !"CUB".equals(p.getCharacterId())) // Companion doesn't count
                .filter(p -> !"LEADER".equals(p.getCharacterId())) // Leader doesn't count
                .collect(java.util.stream.Collectors.toList());

        long currentUnitCount = ownedUnits.size();
        System.out.println("DEBUG: Current unit count (excluding Cub and Leader): " + currentUnitCount);

        // B. La somme dépasse-t-elle 5 ?
        // Note: Old Bear and Cub count as ONE slot for recruitment limit.
        if (currentUnitCount + 1 > 4) {
            String unitList = ownedUnits.stream()
                    .map(PieceEntity::getCharacterId)
                    .collect(java.util.stream.Collectors.joining(", "));
            throw new IllegalArgumentException(
                    "Recruitment failed: You cannot exceed the limit of 4 units. Current units found: [" + unitList
                            + "]");
        }
        // ==================================================================================

        // 5. Logique de Création des Pièces
        List<PieceEntity> createdPieces = new ArrayList<>();

        if ("OLD_BEAR".equals(characterId)) {
            // Cas Spécial : Vieil Ours + Ourson
            validatePlacementCount(placements, 2);
            createdPieces.add(createPiece(gameId, "OLD_BEAR", playerIndex, placements.get(0)));
            createdPieces.add(createPiece(gameId, "CUB", playerIndex, placements.get(1)));
        } else {
            // Cas Standard
            validatePlacementCount(placements, 1);
            createdPieces.add(createPiece(gameId, characterId, playerIndex, placements.get(0)));
        }

        // 6. Mise à jour de la carte recrutée
        Integer emptySlot = card.getVisibleSlot();
        card.setState(CardState.RECRUITED);
        card.setRecruitedByIndex(Integer.valueOf(playerIndex));
        card.setVisibleSlot(null);
        cardRepository.save(card);

        // 6b. Marquer que le joueur a recruté
        game.setRecruitmentCount(game.getRecruitmentCount() + 1);
        gameRepository.save(game);

        // 7. Remplissage de la rivière
        refillRiver(gameId, emptySlot);

        return createdPieces;
    }

    // --- Helpers ---

    private void validatePlacementCount(List<HexCoord> placements, int expected) {
        if (placements == null || placements.size() != expected) {
            throw new IllegalArgumentException(
                    "Recruitment requires exactly " + expected + " placement coordinate(s).");
        }
    }

    private PieceEntity createPiece(UUID gameId, String charId, Short owner, HexCoord pos) {
        if (!pos.isValid()) {
            throw new IllegalArgumentException("Invalid placement coordinates: (" + pos.q() + "," + pos.r() + ")");
        }

        if (pieceRepository.findByGameIdAndPosition(gameId, pos.q(), pos.r()).isPresent()) {
            throw new IllegalArgumentException("Cell (" + pos.q() + "," + pos.r() + ") is already occupied.");
        }

        PieceEntity piece = PieceEntity.builder()
                .gameId(gameId)
                .characterId(charId)
                .ownerIndex(owner)
                .q(pos.q())
                .r(pos.r())
                .hasActedThisTurn(true) // La pièce arrive "fatiguée"
                .build();

        return pieceRepository.save(piece);
    }

    private void refillRiver(UUID gameId, Integer slotToFill) {
        if (slotToFill == null)
            return;

        cardRepository.findNextCardInDeck(gameId)
                .ifPresent(nextCard -> {
                    nextCard.setState(CardState.VISIBLE);
                    nextCard.setVisibleSlot(slotToFill);
                    cardRepository.save(nextCard);
                });
    }
}