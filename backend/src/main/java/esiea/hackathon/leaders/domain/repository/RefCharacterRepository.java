package esiea.hackathon.leaders.domain.repository;

import esiea.hackathon.leaders.domain.model.RefCharacterEntity;
import java.util.Optional;
import java.util.List;

public interface RefCharacterRepository {
    Optional<RefCharacterEntity> findById(String id);

    List<RefCharacterEntity> findAll();

    List<RefCharacterEntity> findByScenarioId(Integer scenarioId);
}