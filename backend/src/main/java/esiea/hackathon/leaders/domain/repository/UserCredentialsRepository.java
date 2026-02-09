package esiea.hackathon.leaders.domain.repository;

import esiea.hackathon.leaders.domain.model.UserCredentialsEntity;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserCredentialsRepository extends CrudRepository<UserCredentialsEntity, UUID> {
    Optional<UserCredentialsEntity> findByEmail(String email);

    Optional<UserCredentialsEntity> findByUsername(String username);

    Iterable<UserCredentialsEntity> findTop10ByOrderByEloDesc();
}
