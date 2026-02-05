package esiea.hackathon.leaders.domain.repository;

import esiea.hackathon.leaders.domain.model.GameEntity;
import java.util.Optional;
import java.util.UUID;

public interface GameRepository {
    Optional<GameEntity> findById(UUID id);
    GameEntity save(GameEntity game);
}