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

    @Override
    public PieceEntity save(PieceEntity pieceDomain) {
        PieceJpaEntity infraEntity = PieceMapper.toEntity(pieceDomain);

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
}