package esiea.hackathon.leaders.adapter.infrastructure.repository;

import esiea.hackathon.leaders.adapter.infrastructure.entity.RecruitmentCardJpaEntity;
import esiea.hackathon.leaders.adapter.infrastructure.mappers.RecruitmentCardMapper;
import esiea.hackathon.leaders.domain.model.RecruitmentCardEntity;
import esiea.hackathon.leaders.domain.model.enums.CardState;
import esiea.hackathon.leaders.domain.repository.RecruitmentCardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class JpaRecruitmentCardRepository implements RecruitmentCardRepository {

    private final RecruitmentCardJpaRepository jpaRepository;

    @Override
    public Optional<RecruitmentCardEntity> findById(UUID id) {
        return jpaRepository.findById(id).map(RecruitmentCardMapper::toDomain);
    }

    @Override
    public RecruitmentCardEntity save(RecruitmentCardEntity card) {
        RecruitmentCardJpaEntity entity = RecruitmentCardMapper.toEntity(card);
        RecruitmentCardJpaEntity saved = jpaRepository.save(entity);
        return RecruitmentCardMapper.toDomain(saved);
    }

    @Override
    public Optional<RecruitmentCardEntity> findNextCardInDeck(UUID gameId) {
        return jpaRepository.findFirstByGame_IdAndStateOrderByDeckOrderAsc(gameId, CardState.IN_DECK)
                .map(RecruitmentCardMapper::toDomain);
    }

    @Override
    public List<RecruitmentCardEntity> findAllByGameId(UUID gameId) {
        return jpaRepository.findAllByGame_Id(gameId).stream()
                .map(RecruitmentCardMapper::toDomain)
                .toList();
    }
}