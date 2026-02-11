package esiea.hackathon.leaders.adapter.infrastructure.repository;

import esiea.hackathon.leaders.adapter.infrastructure.entity.RefCharacterJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

interface SpringRefCharacterRepository extends JpaRepository<RefCharacterJpaEntity, String> {
    @Query(value = "SELECT c.* FROM ref_character c JOIN scenario_character sc ON c.id = sc.character_id WHERE sc.scenario_id = :scenarioId", nativeQuery = true)
    List<RefCharacterJpaEntity> findByScenarioId(@Param("scenarioId") Integer scenarioId);
}
