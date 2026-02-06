package esiea.hackathon.leaders.application.services;

import esiea.hackathon.leaders.application.strategies.passive.ArcherCaptureStrategy;
import esiea.hackathon.leaders.application.strategies.passive.AssassinSoloStrategy;
import esiea.hackathon.leaders.application.strategies.passive.PassiveFactory;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import esiea.hackathon.leaders.domain.model.VictoryCheckResult;
import esiea.hackathon.leaders.domain.model.enums.VictoryType;
import esiea.hackathon.leaders.domain.repository.PieceRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VictoryServiceTest {

    @InjectMocks
    private VictoryService victoryService;

    @Mock
    private PieceRepository pieceRepository;
    @Mock
    private PassiveFactory passiveFactory;
    @Mock
    AssassinSoloStrategy assassinStrategy;
    @Mock
    ArcherCaptureStrategy archerStrategy;

    @Test
    @DisplayName("checkVictory - Aucune Victoire via deux ennemis adjacents")
    void checkVictory_noVictory() {
        UUID gameId = UUID.randomUUID();
        // Leader
        PieceEntity leader = PieceEntity.builder()
                .gameId(gameId)
                .ownerIndex((short) 0)
                .characterId("LEADER")
                .q((short) 0)
                .r((short) 0)
                .build()
        ;
        when(pieceRepository.findByGameId(gameId)).thenReturn(List.of(leader));

        VictoryCheckResult result = victoryService.checkVictory(gameId);
        assertFalse(result.isGameOver());
        assertNull(result.winnerPlayerIndex());
    }

    @Test
    @DisplayName("checkVictory - Victoire via deux ennemis adjacents")
    void checkVictory_captureWithTwoAdjacent() {
        UUID gameId = UUID.randomUUID();
        // Leader
        PieceEntity leader = PieceEntity.builder()
                .gameId(gameId)
                .ownerIndex((short) 0)
                .characterId("LEADER")
                .q((short) 0)
                .r((short) 0)
                .build()
        ;
        // ennemi Adjacent 1
        PieceEntity enemy1 = PieceEntity.builder()
                .gameId(gameId)
                .ownerIndex((short) 1)
                .characterId("BRAWLER")
                .q((short) 1)
                .r((short) 0)
                .build()
        ;
        // ennemi Adjacent 2
        PieceEntity enemy2 = PieceEntity.builder()
                .gameId(gameId)
                .ownerIndex((short) 1)
                .characterId("BRAWLER")
                .q((short) 1)
                .r((short) 0)
                .build()
        ;

        when(pieceRepository.findByGameId(gameId)).thenReturn(List.of(leader, enemy1, enemy2));

        VictoryCheckResult result = victoryService.checkVictory(gameId);
        assertTrue(result.isGameOver());
        assertEquals(VictoryType.CAPTURE, result.victoryType());
        assertEquals(1, result.winnerPlayerIndex());
    }

    @Test
    @DisplayName("checkVictory - Victoire via capture assassin")
    void checkVictory_captureByAssassin() {
        UUID gameId = UUID.randomUUID();
        // Leader
        PieceEntity leader = PieceEntity.builder()
                .gameId(gameId)
                .ownerIndex((short) 0)
                .characterId("LEADER")
                .q((short) 0)
                .r((short) 0)
                .build()
        ;
        // ennemi 1
        PieceEntity enemy1 = PieceEntity.builder()
                .gameId(gameId)
                .ownerIndex((short) 1)
                .characterId("ASSASSIN")
                .q((short) 1)
                .r((short) 0)
                .build()
        ;

        when(pieceRepository.findByGameId(gameId)).thenReturn(List.of(leader, enemy1));
        when(passiveFactory.getStrategy("ARCHER_RANGE", ArcherCaptureStrategy.class))
                .thenReturn(null);
        when(passiveFactory.getStrategy("ASSASSIN_SOLO", AssassinSoloStrategy.class))
                .thenReturn(assassinStrategy);
        when(assassinStrategy.canCaptureLeaderAlone(enemy1, leader))
                .thenReturn(true);

        VictoryCheckResult result = victoryService.checkVictory(gameId);
        assertTrue(result.isGameOver());
        assertEquals(VictoryType.CAPTURE, result.victoryType());
        assertEquals(1, result.winnerPlayerIndex());
    }

    @Test
    @DisplayName("checkVictory - Victoire via capture archer")
    void checkVictory_captureByArcher() {
        UUID gameId = UUID.randomUUID();
        // Leader
        PieceEntity leader = PieceEntity.builder()
                .gameId(gameId)
                .ownerIndex((short) 0)
                .characterId("LEADER")
                .q((short) 0)
                .r((short) 0)
                .build()
        ;
        // ennemi 1 - vaut 1 ennemi ajdacent car distance de 1
        PieceEntity enemy1 = PieceEntity.builder()
                .gameId(gameId)
                .ownerIndex((short) 1)
                .characterId("BRAWLER")
                .q((short) 1)
                .r((short) 0)
                .build()
        ;
        // ennemi 2 - archer : vaut 1 ennemi ajdacent car distance de 2
        PieceEntity enemy2 = PieceEntity.builder()
                .gameId(gameId)
                .ownerIndex((short) 1)
                .characterId("ARCHER")
                .q((short) 2)
                .r((short) -1)
                .build()
        ;

        when(pieceRepository.findByGameId(gameId)).thenReturn(List.of(leader, enemy1, enemy2));
        when(passiveFactory.getStrategy("ARCHER_RANGE", ArcherCaptureStrategy.class))
                .thenReturn(archerStrategy);
        when(passiveFactory.getStrategy("ASSASSIN_SOLO", AssassinSoloStrategy.class))
                .thenReturn(null);
        when(archerStrategy.canHelpCapture(enemy2, leader))
                .thenReturn(true);

        VictoryCheckResult result = victoryService.checkVictory(gameId);
        assertTrue(result.isGameOver());
        assertEquals(VictoryType.CAPTURE, result.victoryType());
        assertEquals(1, result.winnerPlayerIndex());
    }

    @Test
    @DisplayName("checkVictory - Victoire via encirclement")
    void checkVictory_encirclement() {
        UUID gameId = UUID.randomUUID();
        // Leader
        PieceEntity leader = PieceEntity.builder()
                .gameId(gameId)
                .ownerIndex((short) 0)
                .characterId("LEADER")
                .q((short) 0)
                .r((short) 0)
                .build()
        ;
        // Les 6 cases autour sont bloquées
        //  L'Ourson (CUB) ne participe jamais à la capture
        List<PieceEntity> blockers = List.of(
                PieceEntity.builder().gameId(gameId).ownerIndex((short) 1).characterId("CUB").q((short) 1).r((short) 0).build(),
                PieceEntity.builder().gameId(gameId).ownerIndex((short) 1).characterId("CUB").q((short) -1).r((short) 0).build(),
                PieceEntity.builder().gameId(gameId).ownerIndex((short) 1).characterId("CUB").q((short) 0).r((short) 1).build(),
                PieceEntity.builder().gameId(gameId).ownerIndex((short) 1).characterId("CUB").q((short) 0).r((short) -1).build(),
                PieceEntity.builder().gameId(gameId).ownerIndex((short) 1).characterId("CUB").q((short) 1).r((short) -1).build(),
                PieceEntity.builder().gameId(gameId).ownerIndex((short) 1).characterId("CUB").q((short) -1).r((short) 1).build()
        );

        when(pieceRepository.findByGameId(gameId))
                .thenReturn(Stream.concat(Stream.of(leader), blockers.stream()).toList());

        VictoryCheckResult result = victoryService.checkVictory(gameId);
        assertTrue(result.isGameOver());
        assertEquals(VictoryType.ENCIRCLEMENT, result.victoryType());
        assertEquals(1, result.winnerPlayerIndex());
    }


}