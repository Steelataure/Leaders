package esiea.hackathon.leaders.adapter.infrastructure.repository;

import esiea.hackathon.leaders.adapter.infrastructure.mappers.RefCharacterMapper;
import esiea.hackathon.leaders.domain.model.RefCharacterEntity;
import esiea.hackathon.leaders.domain.repository.RefCharacterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
public class JpaRefCharacterRepository implements RefCharacterRepository {

    private final SpringRefCharacterRepository springRepository;

    @Override
    public Optional<RefCharacterEntity> findById(String id) {
        return springRepository.findById(id)
                .map(RefCharacterMapper::toDomain);
    }

    @Override
    public List<RefCharacterEntity> findAll() {
        return springRepository.findAll().stream()
                .map(RefCharacterMapper::toDomain)
                .collect(Collectors.toList());
    }
}