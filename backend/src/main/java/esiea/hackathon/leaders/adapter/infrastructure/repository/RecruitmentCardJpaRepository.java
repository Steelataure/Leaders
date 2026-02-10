package esiea.hackathon.leaders.adapter.infrastructure.repository;

import esiea.hackathon.leaders.adapter.infrastructure.entity.RecruitmentCardJpaEntity;
import esiea.hackathon.leaders.domain.model.enums.CardState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RecruitmentCardJpaRepository extends JpaRepository<RecruitmentCardJpaEntity, UUID> {

    Optional<RecruitmentCardJpaEntity> findFirstByGame_IdAndStateOrderByDeckOrderAsc(UUID gameId, CardState state);

    List<RecruitmentCardJpaEntity> findByGame_IdAndState(UUID gameId, CardState state);

    List<RecruitmentCardJpaEntity> findAllByGame_Id(UUID gameId);
}