package esiea.hackathon.leaders.domain.repository;

import esiea.hackathon.leaders.domain.model.UserCredentialsEntity;
import java.util.Optional;

public interface UserCredentialsRepository {
    Optional<UserCredentialsEntity> findByEmail(String email);

    UserCredentialsEntity save(UserCredentialsEntity user);

    boolean existsByEmail(String email);
}
