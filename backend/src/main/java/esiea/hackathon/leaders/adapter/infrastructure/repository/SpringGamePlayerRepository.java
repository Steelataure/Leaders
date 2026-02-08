package esiea.hackathon.leaders.adapter.infrastructure.repository;

import esiea.hackathon.leaders.adapter.infrastructure.entity.GamePlayerJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface SpringGamePlayerRepository extends JpaRepository<GamePlayerJpaEntity, UUID> {
}
