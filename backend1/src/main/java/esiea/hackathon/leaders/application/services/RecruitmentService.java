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

    @Transactional
    public List<PieceEntity> recruit(UUID gameId, Short playerIndex, UUID cardId, List<HexCoord> placements) {

        // 1. Chargement du Jeu
        GameEntity game = gameRepository.findById(gameId)
                .orElseThrow(() -> new IllegalArgumentException("Game not found"));

        // 2. SÉCURITÉ : Vérification du tour
        if (game.getCurrentPlayerIndex() != playerIndex.intValue()) {
            throw new IllegalStateException("Action refusée : Ce n'est pas le tour du joueur " + playerIndex);
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

        // ==================================================================================
        // 4. 👇 VERIFICATION DE LA LIMITE (Max 5 pièces) - AJOUT IMPORTANT 👇
        // ==================================================================================

        // A. Combien de pièces cette carte va-t-elle ajouter ? (1 normalement, 2 pour l'Ours)
        String characterId = card.getCharacter().getId();
        int piecesToAdd = "OLD_BEAR".equals(characterId) ? 2 : 1;

        // B. Combien de pièces le joueur possède-t-il DÉJÀ sur le plateau ?
        long currentPieceCount = pieceRepository.findByGameId(gameId).stream()
                .filter(p -> p.getOwnerIndex().equals(playerIndex)) // On filtre les pièces du joueur
                .count();

        // C. La somme dépasse-t-elle 5 ?
        if (currentPieceCount + piecesToAdd > 5) {
            throw new IllegalArgumentException("Recruitment failed: You cannot exceed the limit of 5 units.");
        }
        // ==================================================================================


        // 5. Logique de Création des Pièces
        List<PieceEntity> createdPieces = new ArrayList<>();

        if ("OLD_BEAR".equals(characterId)) {
            // Cas Spécial : L'Ours vient avec son Ourson
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

        // 7. Remplissage de la rivière
        refillRiver(gameId, emptySlot);

        return createdPieces;
    }

    // --- Helpers ---

    private void validatePlacementCount(List<HexCoord> placements, int expected) {
        if (placements == null || placements.size() != expected) {
            throw new IllegalArgumentException("Recruitment requires exactly " + expected + " placement coordinate(s).");
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
        if (slotToFill == null) return;

        cardRepository.findNextCardInDeck(gameId)
                .ifPresent(nextCard -> {
                    nextCard.setState(CardState.VISIBLE);
                    nextCard.setVisibleSlot(slotToFill);
                    cardRepository.save(nextCard);
                });
    }
}