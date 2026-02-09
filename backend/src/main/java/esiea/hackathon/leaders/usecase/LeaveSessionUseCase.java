package esiea.hackathon.leaders.usecase;

import esiea.hackathon.leaders.domain.Session;
import esiea.hackathon.leaders.domain.SessionRepository;
import esiea.hackathon.leaders.domain.model.GameEntity;
import esiea.hackathon.leaders.domain.model.GamePlayerEntity;
import esiea.hackathon.leaders.domain.model.enums.GameStatus;
import esiea.hackathon.leaders.domain.model.enums.VictoryType;
import esiea.hackathon.leaders.domain.repository.GameRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LeaveSessionUseCase {
    private final SessionRepository sessionRepository;
    private final GameRepository gameRepository;

    public void leaveSession(String sessionId, String userId) {
        // Use String directly, don't force UUID
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found: " + sessionId));

        // Si la partie est en cours, le départ d'un joueur termine la partie
        if (session.getStatus() == Session.SessionStatus.ACTIVE) {
            session.setStatus(Session.SessionStatus.FINISHED);

            // Gestion de la partie (GameEntity)
            try {
                UUID gameId = UUID.fromString(sessionId);
                GameEntity game = gameRepository.findById(gameId).orElse(null);

                if (game != null && game.getStatus() == GameStatus.IN_PROGRESS) {
                    game.setStatus(GameStatus.FINISHED);
                    game.setWinnerVictoryType(VictoryType.RESIGNATION);

                    // Déterminer le gagnant (celui qui n'a PA quitté)
                    Integer leaverIndex = null;
                    if (game.getPlayers() != null) {
                        for (GamePlayerEntity p : game.getPlayers()) {
                            if (p.getUserId().toString().equals(userId)) {
                                leaverIndex = p.getPlayerIndex();
                                break;
                            }
                        }
                    }

                    if (leaverIndex != null) {
                        game.setWinnerPlayerIndex(leaverIndex == 0 ? 1 : 0);
                    } else {
                        // Fallback si on ne trouve pas le joueur (ne devrait pas arriver)
                        System.err.println("ERROR: Leaving player " + userId + " not found in game " + gameId);
                    }

                    gameRepository.save(game);
                }
            } catch (Exception e) {
                System.err.println("Error updating game status on leave: " + e.getMessage());
            }

            System.out.println("DEBUG: Session " + sessionId + " finished by user " + userId);
        }
        // Si la partie est en attente, on retire le joueur
        else if (session.getStatus() == Session.SessionStatus.WAITING_FOR_PLAYER) {
            if (session.getPlayer1() != null && session.getPlayer1().getId().equals(userId)) {
                session.setPlayer1(null);
            } else if (session.getPlayer2() != null && session.getPlayer2().getId().equals(userId)) {
                session.setPlayer2(null);
            }

            // Si la session devient vide, on pourrait la supprimer, ou la laisser ouverte
            if (session.getPlayer1() == null && session.getPlayer2() == null) {
                // If everyone leaves queue, delete or finish
                session.setStatus(Session.SessionStatus.FINISHED);
            }
        }

        sessionRepository.save(session);
    }
}
