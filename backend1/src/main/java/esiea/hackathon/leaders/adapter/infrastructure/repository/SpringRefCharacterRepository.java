package esiea.hackathon.leaders.adapter.infrastructure.repository;

import esiea.hackathon.leaders.adapter.infrastructure.entity.RefCharacterJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

interface SpringRefCharacterRepository extends JpaRepository<RefCharacterJpaEntity, String> { }
