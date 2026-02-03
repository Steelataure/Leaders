package esiea.hackathon.leaders.adapter.infrastructure.persistence;

import esiea.hackathon.leaders.domain.model.UserCredentialsEntity;
import esiea.hackathon.leaders.domain.repository.UserCredentialsRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface JpaUserCredentialsRepository
        extends JpaRepository<UserCredentialsEntity, UUID>, UserCredentialsRepository {
    // Methods match automatically by name
}
