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
    private final jakarta.persistence.EntityManager entityManager;

    @Override
    public Optional<RecruitmentCardEntity> findById(UUID id) {
        return jpaRepository.findById(id).map(RecruitmentCardMapper::toDomain);
    }

    @Override
    public RecruitmentCardEntity save(RecruitmentCardEntity card) {
        RecruitmentCardJpaEntity entity = RecruitmentCardMapper.toEntity(card);

        // FIX: Re-attach Game Entity to avoid TransientPropertyValueException
        if (card.getGame() != null && card.getGame().getId() != null) {
            esiea.hackathon.leaders.adapter.infrastructure.entity.GameJpaEntity gameRef = entityManager.getReference(
                    esiea.hackathon.leaders.adapter.infrastructure.entity.GameJpaEntity.class, card.getGame().getId());
            entity.setGame(gameRef);
        }

        RecruitmentCardJpaEntity saved = jpaRepository.save(entity);
        return RecruitmentCardMapper.toDomain(saved);
    }

    @Override
    public Optional<RecruitmentCardEntity> findNextCardInDeck(UUID gameId) {
        return jpaRepository.findFirstByGame_IdAndStateOrderByDeckOrderAsc(gameId, CardState.IN_DECK)
                .map(RecruitmentCardMapper::toDomain);
    }

    @Override
    public List<RecruitmentCardEntity> findByGameIdAndState(UUID gameId, CardState state) {
        return jpaRepository.findByGame_IdAndState(gameId, state).stream()
                .map(RecruitmentCardMapper::toDomain)
                .toList();
    }

    @Override
    public List<RecruitmentCardEntity> findAllByGameId(UUID gameId) {
        return jpaRepository.findAllByGame_Id(gameId).stream()
                .map(RecruitmentCardMapper::toDomain)
                .toList();
    }
}