package esiea.hackathon.leaders.adapter.infrastructure.mappers;

import esiea.hackathon.leaders.adapter.infrastructure.entity.GameJpaEntity;
import esiea.hackathon.leaders.adapter.infrastructure.entity.PieceJpaEntity;
import esiea.hackathon.leaders.adapter.infrastructure.entity.RefCharacterJpaEntity;
import esiea.hackathon.leaders.domain.model.PieceEntity;

public class PieceMapper {

    // --- Vers le Domaine ---
    public static PieceEntity toDomain(PieceJpaEntity entity) {
        if (entity == null) {
            return null;
        }

        return new PieceEntity(
                entity.getId(),
                entity.getGame() != null ? entity.getGame().getId() : null,
                entity.getCharacter() != null ? entity.getCharacter().getId() : null,
                entity.getOwnerIndex(),
                entity.getQ(),
                entity.getR(),
                entity.getHasActedThisTurn()
        );
    }

    // --- Vers l'Infrastructure ---
    public static PieceJpaEntity toEntity(PieceEntity domain) {
        if (domain == null) {
            return null;
        }

        GameJpaEntity gameRef = null;
        if (domain.getGameId() != null) {
            gameRef = GameJpaEntity.builder().id(domain.getGameId()).build();
        }

        RefCharacterJpaEntity charRef = null;
        if (domain.getCharacterId() != null) {
            charRef = RefCharacterJpaEntity.builder().id(domain.getCharacterId()).build();
        }

        return PieceJpaEntity.builder()
                .id(domain.getId())
                .game(gameRef) // On passe l'objet JPA
                .character(charRef) // On passe l'objet JPA
                .ownerIndex(domain.getOwnerIndex())
                .q(domain.getQ())
                .r(domain.getR())
                .hasActedThisTurn(domain.getHasActedThisTurn())
                .build();
    }
}
