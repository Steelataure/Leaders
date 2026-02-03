package esiea.hackathon.leaders.domain.repository;

import esiea.hackathon.leaders.domain.model.PieceEntity;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PieceRepository {

    PieceEntity save(PieceEntity piece);

    Optional<PieceEntity> findById(UUID id);

    List<PieceEntity> findByGameId(UUID gameId);

    List<PieceEntity> findByGameIdAndOwnerIndex(UUID gameId, Short ownerIndex);

    Optional<PieceEntity> findByGameIdAndPosition(UUID gameId, Short q, Short r);

    long countByGameIdAndOwnerIndex(UUID gameId, Short ownerIndex);

    void delete(UUID id);
}