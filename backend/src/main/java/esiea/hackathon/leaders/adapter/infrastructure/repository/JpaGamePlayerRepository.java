package esiea.hackathon.leaders.adapter.infrastructure.repository;

import esiea.hackathon.leaders.adapter.infrastructure.entity.GamePlayerJpaEntity;
import esiea.hackathon.leaders.adapter.infrastructure.mappers.GameMapper;
import esiea.hackathon.leaders.domain.model.GamePlayerEntity;
import esiea.hackathon.leaders.domain.repository.GamePlayerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class JpaGamePlayerRepository implements GamePlayerRepository {

    private final SpringGamePlayerRepository springRepository;

    @Override
    public GamePlayerEntity save(GamePlayerEntity player) {
        GamePlayerJpaEntity jpaEntity = GameMapper.toPlayerJpa(player);
        GamePlayerJpaEntity saved = springRepository.save(jpaEntity);
        return GameMapper.toPlayerDomain(saved);
    }
}
