package esiea.hackathon.leaders.adapter.infrastructure.repository;

import esiea.hackathon.leaders.adapter.infrastructure.entity.PieceJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SpringPieceRepository extends JpaRepository<PieceJpaEntity, UUID> {

    List<PieceJpaEntity> findByGameId(UUID gameId);

    List<PieceJpaEntity> findByGameIdAndOwnerIndex(UUID gameId, Short ownerIndex);

    // Spring gère le "AndQAndR" tout seul, pas besoin de @Query manuelle
    Optional<PieceJpaEntity> findByGameIdAndQAndR(UUID gameId, Short q, Short r);

    long countByGameIdAndOwnerIndex(UUID gameId, Short ownerIndex);
}