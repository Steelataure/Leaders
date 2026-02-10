package esiea.hackathon.leaders.domain.repository;

import esiea.hackathon.leaders.domain.model.GamePlayerEntity;

public interface GamePlayerRepository {
    GamePlayerEntity save(GamePlayerEntity player);
}
