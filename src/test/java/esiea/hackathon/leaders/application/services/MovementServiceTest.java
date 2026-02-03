package esiea.hackathon.leaders.application.services;

import esiea.hackathon.leaders.domain.model.PieceEntity;
import esiea.hackathon.leaders.domain.repository.PieceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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

    @InjectMocks
    private MovementService movementService;

    private PieceEntity piece;
    private final UUID gameId = UUID.randomUUID();
    private final UUID pieceId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        // Initialisation d'une pièce standard au centre (0,0) pour les tests
        piece = PieceEntity.builder()
                .id(pieceId)
                .gameId(gameId)
                .q((short) 0)
                .r((short) 0)
                .hasActedThisTurn(false)
                .build();
    }

    @Test
    @DisplayName("Devrait détecter l'adjacence correctement")
    void areAdjacent() {
        // Voisins directs de (0,0)
        assertTrue(movementService.areAdjacent((short)0, (short)0, (short)1, (short)0), "0,0 et 1,0 sont voisins");
        assertTrue(movementService.areAdjacent((short)0, (short)0, (short)0, (short)-1), "0,0 et 0,-1 sont voisins");

        // Cas non adjacents
        assertFalse(movementService.areAdjacent((short)0, (short)0, (short)2, (short)0), "Distance 2 n'est pas adjacente");
        assertFalse(movementService.areAdjacent((short)0, (short)0, (short)1, (short)1), "1,1 n'est pas voisin de 0,0 en hexagone");
    }

    @Test
    @DisplayName("Devrait valider les coordonnées dans le rayon du plateau (rayon 3)")
    void isValidHexCoord() {
        // Centre
        assertTrue(movementService.isValidHexCoord((short) 0, (short) 0), "Le centre est valide");

        // Bords
        assertTrue(movementService.isValidHexCoord((short) 3, (short) 0), "Le bord (3,0) est valide");
        assertTrue(movementService.isValidHexCoord((short) -3, (short) 3), "Le coin (-3,3) est valide");
        assertTrue(movementService.isValidHexCoord((short) 0, (short) -3), "Le bord (0,-3) est valide");

        // Hors limites
        assertFalse(movementService.isValidHexCoord((short) 4, (short) 0), "4,0 est hors limite");
        assertFalse(movementService.isValidHexCoord((short) 3, (short) 3), "3,3 est hors limite (q+r=6)");
        assertFalse(movementService.isValidHexCoord((short) -4, (short) 1), "-4,1 est hors limite");
    }


    @Test
    @DisplayName("Devrait retourner les 6 voisins pour une case centrale")
    void getAdjacentCells() {
        List<MovementService.HexCoord> neighbors = movementService.getAdjacentCells((short) 0, (short) 0);

        assertEquals(6, neighbors.size());
        assertTrue(neighbors.contains(new MovementService.HexCoord((short) 1, (short) 0)));
        assertTrue(neighbors.contains(new MovementService.HexCoord((short) -1, (short) 0)));
    }

    // --- 2. TESTS DU DÉPLACEMENT (Logique Métier) ---

    @Test
    @DisplayName("Move: Succès - Déplacement valide vers case vide")
    void movePiece_Success() {
        // GIVEN
        short targetQ = 1;
        short targetR = 0;

        when(pieceRepository.findById(pieceId)).thenReturn(Optional.of(piece));
        when(pieceRepository.findByGameIdAndPosition(gameId, targetQ, targetR)).thenReturn(Optional.empty());
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
    @DisplayName("Move: Erreur - Déplacement non adjacent")
    void movePiece_NotAdjacent() {
        when(pieceRepository.findById(pieceId)).thenReturn(Optional.of(piece));

        // On essaie de sauter une case (0,0 -> 2,0)
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
                movementService.movePiece(pieceId, (short)2, (short)0)
        );
        assertTrue(exception.getMessage().contains("not adjacent"));
    }

    @Test
    @DisplayName("Move: Erreur - Case cible occupée")
    void movePiece_Occupied() {
        short targetQ = 1;
        short targetR = 0;

        when(pieceRepository.findById(pieceId)).thenReturn(Optional.of(piece));
        // La case est occupée par une autre pièce
        PieceEntity obstacle = PieceEntity.builder().id(UUID.randomUUID()).build();
        when(pieceRepository.findByGameIdAndPosition(gameId, targetQ, targetR))
                .thenReturn(Optional.of(obstacle));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
                movementService.movePiece(pieceId, targetQ, targetR)
        );
        assertTrue(exception.getMessage().contains("occupied"));
    }

    @Test
    @DisplayName("Move: Erreur - Coordonnées invalides (Hors plateau)")
    void movePiece_InvalidCoord() {

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> movementService.movePiece(pieceId, (short) 10, (short) 10)
        );

        assertEquals("Invalid hex coordinates", exception.getMessage());
    }


    // --- 3. TESTS DES MOUVEMENTS VALIDES POSSIBLES ---

    @Test
    @DisplayName("GetValidMoves: Devrait retourner uniquement les cases vides et valides")
    void getValidMovesForPiece() {
        // GIVEN
        when(pieceRepository.findById(pieceId)).thenReturn(Optional.of(piece));

        // Simulation :
        // Le voisin (1,0) est OCCUPÉ
        // Le voisin (-1,0) est VIDE
        // Les autres sont VIDES par défaut (mock retourne empty)

        when(pieceRepository.findByGameIdAndPosition(eq(gameId), eq((short)1), eq((short)0)))
                .thenReturn(Optional.of(new PieceEntity())); // Occupé

        when(pieceRepository.findByGameIdAndPosition(eq(gameId), eq((short)-1), eq((short)0)))
                .thenReturn(Optional.empty()); // Vide

        // WHEN
        List<MovementService.HexCoord> validMoves = movementService.getValidMovesForPiece(pieceId);

        // THEN
        // (0,0) a 6 voisins théoriques.
        // (1,0) est occupé -> retiré.
        // Il devrait en rester 5 (si on considère qu'on est au centre du plateau)
        assertEquals(5, validMoves.size());

        // Vérifie que la case occupée n'est PAS dans la liste
        assertFalse(validMoves.contains(new MovementService.HexCoord((short)1, (short)0)));

        // Vérifie qu'une case vide EST dans la liste
        assertTrue(validMoves.contains(new MovementService.HexCoord((short)-1, (short)0)));
    }
}