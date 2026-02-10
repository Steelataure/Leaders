package esiea.hackathon.leaders.adapter.infrastructure.repository;

import esiea.hackathon.leaders.adapter.infrastructure.entity.PieceJpaEntity;
import esiea.hackathon.leaders.adapter.infrastructure.mappers.PieceMapper;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import esiea.hackathon.leaders.domain.repository.PieceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
public class JpaPieceRepository implements PieceRepository {

    private final SpringPieceRepository springRepository;
    private final jakarta.persistence.EntityManager entityManager;

    @Override
    public PieceEntity save(PieceEntity pieceDomain) {
        PieceJpaEntity infraEntity = PieceMapper.toEntity(pieceDomain);

        // FIX: Re-attach entities
        if (pieceDomain.getGameId() != null) {
            esiea.hackathon.leaders.adapter.infrastructure.entity.GameJpaEntity gameRef = entityManager.getReference(
                    esiea.hackathon.leaders.adapter.infrastructure.entity.GameJpaEntity.class, pieceDomain.getGameId());
            infraEntity.setGame(gameRef);
        }
        if (pieceDomain.getCharacterId() != null) {
            esiea.hackathon.leaders.adapter.infrastructure.entity.RefCharacterJpaEntity charRef = entityManager
                    .getReference(
                            esiea.hackathon.leaders.adapter.infrastructure.entity.RefCharacterJpaEntity.class,
                            pieceDomain.getCharacterId());
            infraEntity.setCharacter(charRef);
        }

        PieceJpaEntity saved = springRepository.save(infraEntity);

        return PieceMapper.toDomain(saved);
    }

    @Override
    public Optional<PieceEntity> findById(UUID id) {
        return springRepository.findById(id)
                .map(PieceMapper::toDomain);
    }

    @Override
    public List<PieceEntity> findByGameId(UUID gameId) {
        return springRepository.findByGameId(gameId).stream()
                .map(PieceMapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<PieceEntity> findByGameIdAndOwnerIndex(UUID gameId, Short ownerIndex) {
        return springRepository.findByGameIdAndOwnerIndex(gameId, ownerIndex).stream()
                .map(PieceMapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<PieceEntity> findByGameIdAndPosition(UUID gameId, Short q, Short r) {
        // Utilise la méthode native de Spring (Q et R)
        return springRepository.findByGameIdAndQAndR(gameId, q, r)
                .map(PieceMapper::toDomain);
    }

    @Override
    public long countByGameIdAndOwnerIndex(UUID gameId, Short ownerIndex) {
        return springRepository.countByGameIdAndOwnerIndex(gameId, ownerIndex);
    }

    @Override
    public void delete(UUID id) {
        springRepository.deleteById(id);
    }

    @Override
    public List<PieceEntity> saveAll(List<PieceEntity> pieces) {
        List<PieceJpaEntity> entities = pieces.stream()
                .map(p -> {
                    PieceJpaEntity entity = PieceMapper.toEntity(p);
                    if (p.getGameId() != null) {
                        esiea.hackathon.leaders.adapter.infrastructure.entity.GameJpaEntity gameRef = entityManager
                                .getReference(esiea.hackathon.leaders.adapter.infrastructure.entity.GameJpaEntity.class,
                                        p.getGameId());
                        entity.setGame(gameRef);
                    }
                    if (p.getCharacterId() != null) {
                        esiea.hackathon.leaders.adapter.infrastructure.entity.RefCharacterJpaEntity charRef = entityManager
                                .getReference(
                                        esiea.hackathon.leaders.adapter.infrastructure.entity.RefCharacterJpaEntity.class,
                                        p.getCharacterId());
                        entity.setCharacter(charRef);
                    }
                    return entity;
                })
                .collect(Collectors.toList());

        return springRepository.saveAll(entities).stream()
                .map(PieceMapper::toDomain)
                .collect(Collectors.toList());
    }
}