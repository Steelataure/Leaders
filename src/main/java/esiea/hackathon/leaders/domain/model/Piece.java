package esiea.hackathon.leaders.domain.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "piece")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Piece {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    
    @Column(name = "game_id", nullable = false)
    private UUID gameId;
    
    @Column(name = "character_id", nullable = false, length = 30)
    private String characterId;
    
    @Column(name = "owner_index", nullable = false)
    private Short ownerIndex;
    
    @Column(nullable = false)
    private Short q; // coordonnée hexagonale axiale
    
    @Column(nullable = false)
    private Short r; // coordonnée hexagonale axiale
    
    @Column(name = "has_acted_this_turn", nullable = false)
    private Boolean hasActedThisTurn = false;
}