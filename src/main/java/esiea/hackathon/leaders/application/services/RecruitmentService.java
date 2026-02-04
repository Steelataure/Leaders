package esiea.hackathon.leaders.application.services;

import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import esiea.hackathon.leaders.domain.model.RecruitmentCardEntity; // <--- Import du Domaine
import esiea.hackathon.leaders.domain.model.enums.CardState;
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

    @Transactional
    public List<PieceEntity> recruit(UUID gameId, Short playerIndex, UUID cardId, List<HexCoord> placements) {

        RecruitmentCardEntity card = cardRepository.findById(cardId)
                .orElseThrow(() -> new IllegalArgumentException("Card not found"));

        // 2. Validations
        // On navigue dans les objets du domaine
        if (!card.getGame().getId().equals(gameId)) {
            throw new IllegalArgumentException("Card does not belong to this game");
        }
        if (card.getState() != CardState.VISIBLE) {
            throw new IllegalArgumentException("Card is not visible in the river (State: " + card.getState() + ")");
        }

        // 3. Logique de Création des Pièces
        List<PieceEntity> createdPieces = new ArrayList<>();

        // card.getCharacter() est un RefCharacterEntity (Domaine)
        String characterId = card.getCharacter().getId();

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

        // 4. Mise à jour de la carte recrutée
        // On travaille sur l'objet du domaine
        Integer emptySlot = card.getVisibleSlot();

        card.setState(CardState.RECRUITED);
        card.setRecruitedByIndex(Integer.valueOf(playerIndex));
        card.setVisibleSlot(null);

        // Le repository (via l'adapter) va convertir Domain -> JPA -> BDD
        cardRepository.save(card);

        // 5. Remplissage de la rivière
        refillRiver(gameId, emptySlot);

        return createdPieces;
    }

    // --- Helpers ---

    private void validatePlacementCount(List<HexCoord> placements, int expected) {
        if (placements == null || placements.size() != expected) {
            throw new IllegalArgumentException("This recruitment requires exactly " + expected + " placement coordinate(s).");
        }
    }

    private PieceEntity createPiece(UUID gameId, String charId, Short owner, HexCoord pos) {
        if (!pos.isValid()) {
            throw new IllegalArgumentException("Invalid placement coordinates: (" + pos.q() + "," + pos.r() + ")");
        }

        // Vérification case occupée
        if (pieceRepository.findByGameIdAndPosition(gameId, pos.q(), pos.r()).isPresent()) {
            throw new IllegalArgumentException("Cell (" + pos.q() + "," + pos.r() + ") is already occupied.");
        }

        PieceEntity piece = PieceEntity.builder()
                // .id(UUID.randomUUID())
                .gameId(gameId)
                .characterId(charId)
                .ownerIndex(owner)
                .q(pos.q())
                .r(pos.r())
                .hasActedThisTurn(true)
                .build();

        return pieceRepository.save(piece);
    }

    private void refillRiver(UUID gameId, Integer slotToFill) {
        if (slotToFill == null) return;

        // Utilisation de la méthode métier définie dans l'interface du Domaine
        cardRepository.findNextCardInDeck(gameId)
                .ifPresent(nextCard -> {
                    nextCard.setState(CardState.VISIBLE);
                    nextCard.setVisibleSlot(slotToFill);
                    cardRepository.save(nextCard);
                });
    }
}