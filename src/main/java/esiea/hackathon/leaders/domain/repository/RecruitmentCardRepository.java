package esiea.hackathon.leaders.domain.repository;

import esiea.hackathon.leaders.domain.model.RecruitmentCardEntity;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RecruitmentCardRepository {
    Optional<RecruitmentCardEntity> findById(UUID id);
    RecruitmentCardEntity save(RecruitmentCardEntity card);

    // Méthode métier pour la rivière
    Optional<RecruitmentCardEntity> findNextCardInDeck(UUID gameId);

    List<RecruitmentCardEntity> findAllByGameId(UUID gameId);

}