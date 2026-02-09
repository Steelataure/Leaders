package esiea.hackathon.leaders.usecase;

import esiea.hackathon.leaders.domain.Session;
import esiea.hackathon.leaders.domain.SessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LeaveSessionUseCase {
    private final SessionRepository sessionRepository;

    public void leaveSession(String sessionId, String userId) {
        // Use String directly, don't force UUID
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found: " + sessionId));

        // Si la partie est en cours, le départ d'un joueur termine la partie
        if (session.getStatus() == Session.SessionStatus.ACTIVE) {
            session.setStatus(Session.SessionStatus.FINISHED);
            // Optionally clear players or keep them for history.
            // Clearing them ensures StatsUseCase definitely doesn't count them if logic
            // changes.
            // But getting status FINISHED is enough for current StatsUseCase.
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
