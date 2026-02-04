package esiea.hackathon.leaders.adapter.infrastructure.repository;

import esiea.hackathon.leaders.adapter.infrastructure.entity.GameJpaEntity;
import esiea.hackathon.leaders.adapter.infrastructure.mappers.GameMapper;
import esiea.hackathon.leaders.domain.model.GameEntity;
import esiea.hackathon.leaders.domain.repository.GameRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class JpaGameRepository implements GameRepository {

    private final SpringGameRepository jpaRepository;

    @Override
    public Optional<GameEntity> findById(UUID id) {
        return jpaRepository.findById(id)
                .map(GameMapper::toDomain);
    }

    @Override
    public GameEntity save(GameEntity game) {
        // 1. Conversion Domaine -> JPA
        GameJpaEntity jpaEntity = GameMapper.toEntity(game);

        // 2. Sauvegarde
        GameJpaEntity savedEntity = jpaRepository.save(jpaEntity);

        // 3. Retour en Domaine
        return GameMapper.toDomain(savedEntity);
    }
}