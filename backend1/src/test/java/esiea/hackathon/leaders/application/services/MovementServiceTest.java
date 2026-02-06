package esiea.hackathon.leaders.application.services;

import esiea.hackathon.leaders.application.strategies.action.NemesisBehavior;
import esiea.hackathon.leaders.application.strategies.movement.MoveStrategyFactory;
import esiea.hackathon.leaders.domain.model.GameEntity;
import esiea.hackathon.leaders.domain.model.HexCoord;
import esiea.hackathon.leaders.domain.model.PieceEntity;
import esiea.hackathon.leaders.domain.model.RefCharacterEntity;
import esiea.hackathon.leaders.domain.repository.GameRepository;
import esiea.hackathon.leaders.domain.repository.PieceRepository;
import esiea.hackathon.leaders.domain.repository.RefCharacterRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MovementServiceTest {

    @Mock
    private PieceRepository pieceRepository;
    @Mock
    private RefCharacterRepository characterRepository;
    @Mock
    private GameRepository gameRepository;


    @InjectMocks
    private MovementService movementService;

    private PieceEntity piece;
    private GameEntity game;
    private RefCharacterEntity character;
    private final UUID gameId = UUID.randomUUID();
    private final UUID pieceId = UUID.randomUUID();
    private final String characterId = "SOLDIER";

    @BeforeEach
    void setUp() {
        piece = PieceEntity.builder()
                .id(pieceId)
                .gameId(gameId)
                .characterId(characterId)
                .ownerIndex((short) 0)
                .q((short) 0)
                .r((short) 0)
                .hasActedThisTurn(false)
                .build();

        game = GameEntity.builder()
                .id(gameId)
                .currentPlayerIndex(0)
                .build();

        character = new RefCharacterEntity();
        character.setId(characterId);
    }

    @Test
    @DisplayName("Devrait détecter l'adjacence correctement")
    void areAdjacent() {
        List<HexCoord> adjacent = movementService.getAdjacentCells((short)0, (short)0);
        assertTrue(adjacent.contains(new HexCoord((short)1, (short)0)));
        assertTrue(adjacent.contains(new HexCoord((short)0, (short)-1)));
        assertFalse(adjacent.contains(new HexCoord((short)2, (short)0)));
    }


    @Test
    @DisplayName("Devrait retourner les 6 voisins pour une case centrale")
    void getAdjacentCells() {
        List<HexCoord> neighbors = movementService.getAdjacentCells((short) 0, (short) 0);

        assertEquals(6, neighbors.size());
        assertTrue(neighbors.contains(new HexCoord((short) 1, (short) 0)));
        assertTrue(neighbors.contains(new HexCoord((short) -1, (short) 0)));
    }

    // --- 2. TESTS DU DÉPLACEMENT (Logique Métier) ---

    @Test
    @DisplayName("Move: Succès - Déplacement valide vers case vide")
    void movePiece_Success() {
        // GIVEN
        short targetQ = 1;
        short targetR = 0;

        when(pieceRepository.findById(pieceId)).thenReturn(Optional.of(piece));
        when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));
        when(characterRepository.findById(characterId)).thenReturn(Optional.of(character));
        when(pieceRepository.findByGameId(gameId)).thenReturn(Collections.singletonList(piece));

        when(pieceRepository.save(any(PieceEntity.class))).thenAnswer(i -> i.getArguments()[0]);

        // WHEN
        PieceEntity result = movementService.movePiece(pieceId, targetQ, targetR);

        // THEN
        assertNotNull(result);
        assertEquals(targetQ, result.getQ());
        assertEquals(targetR, result.getR());
        assertTrue(result.getHasActedThisTurn());

        verify(pieceRepository).save(piece);
    }

    @Test
    @DisplayName("Move: Erreur - Pièce introuvable")
    void movePiece_NotFound() {
        when(pieceRepository.findById(pieceId)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () ->
                movementService.movePiece(pieceId, (short)1, (short)0)
        );
        verify(pieceRepository, never()).save(piece);
    }

    @Test
    @DisplayName("Move: Erreur - Mauvais tour de joueur")
    void movePiece_WrongTurn() {
        // GIVEN
        game.setCurrentPlayerIndex(1);

        when(pieceRepository.findById(pieceId)).thenReturn(Optional.of(piece));
        when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));

        // WHEN
        IllegalStateException exception = assertThrows(IllegalStateException.class, () ->
                movementService.movePiece(pieceId, (short)1, (short)0)
        );

        // THEN
        assertTrue(exception.getMessage().contains("Ce n'est pas votre tour")
                || exception.getMessage().contains("Action refusée"));

        verify(pieceRepository, never()).save(piece);
    }


    @Test
    @DisplayName("Move: Erreur - Déplacement non adjacent (et non permis par stratégies)")
    void movePiece_NotAdjacent() {
        when(pieceRepository.findById(pieceId)).thenReturn(Optional.of(piece));
        when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));
        when(characterRepository.findById(characterId)).thenReturn(Optional.of(character));
        when(pieceRepository.findByGameId(gameId)).thenReturn(Collections.singletonList(piece));

        // On essaie de sauter une case (0,0 -> 2,0)
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
                movementService.movePiece(pieceId, (short)2, (short)0)
        );
        assertTrue(exception.getMessage().contains("Illegal move"));
    }

    @Test
    @DisplayName("Move: Erreur - Case cible occupée")
    void movePiece_Occupied() {
        short targetQ = 1;
        short targetR = 0;

        when(pieceRepository.findById(pieceId)).thenReturn(Optional.of(piece));
        when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));
        when(characterRepository.findById(characterId)).thenReturn(Optional.of(character));

        // La case est occupée par une autre pièce
        PieceEntity obstacle = PieceEntity.builder()
                .id(UUID.randomUUID())
                .gameId(gameId)
                .q(targetQ)
                .r(targetR)
                .build();
        when(pieceRepository.findByGameId(gameId)).thenReturn(List.of(piece, obstacle));


        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
                movementService.movePiece(pieceId, targetQ, targetR)
        );
        assertTrue(exception.getMessage().contains("Illegal move"));
    }

    @Test
    @DisplayName("Move: Erreur - Coordonnées invalides (Hors plateau)")
    void movePiece_InvalidCoord() {

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> movementService.movePiece(pieceId, (short) 10, (short) 10)
        );

        assertEquals("Invalid hex coordinates: (10,10)", exception.getMessage());
    }


    // --- 3. TESTS DES MOUVEMENTS VALIDES POSSIBLES ---

    @Test
    @DisplayName("GetValidMoves: Devrait retourner uniquement les cases vides et valides")
    void getValidMovesForPiece() {
        // GIVEN
        when(pieceRepository.findById(pieceId)).thenReturn(Optional.of(piece));
        when(characterRepository.findById(characterId)).thenReturn(Optional.of(character));

        PieceEntity obstacle = PieceEntity.builder()
                .id(UUID.randomUUID())
                .gameId(gameId)
                .q((short)1)
                .r((short)0)
                .build();

        when(pieceRepository.findByGameId(gameId)).thenReturn(List.of(piece, obstacle));

        // WHEN
        List<HexCoord> validMoves = movementService.getValidMovesForPiece(pieceId);

        // THEN
        assertEquals(5, validMoves.size());

        // Vérifie que la case occupée n'est PAS dans la liste
        assertFalse(validMoves.contains(new HexCoord((short)1, (short)0)));

        // Vérifie qu'une case vide EST dans la liste (ex: -1, 0)
        assertTrue(validMoves.contains(new HexCoord((short)-1, (short)0)));
    }
}