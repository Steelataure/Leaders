package esiea.hackathon.leaders.domain.repository;

import esiea.hackathon.leaders.domain.model.Piece;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PieceRepository extends JpaRepository<Piece, UUID> {
    
    // Récupère toutes les pièces d'une partie
    List<Piece> findByGameId(UUID gameId);
    
    // Récupère les pièces d'un joueur dans une partie
    List<Piece> findByGameIdAndOwnerIndex(UUID gameId, Short ownerIndex);
    
    // Vérifie si une case est occupée
    @Query("SELECT p FROM Piece p WHERE p.gameId = :gameId AND p.q = :q AND p.r = :r")
    Optional<Piece> findByGameIdAndPosition(UUID gameId, Short q, Short r);
    
    // Compte les pièces d'un joueur (vérif limite 5)
    long countByGameIdAndOwnerIndex(UUID gameId, Short ownerIndex);
}