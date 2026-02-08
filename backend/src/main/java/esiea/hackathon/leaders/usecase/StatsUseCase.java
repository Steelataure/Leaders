package esiea.hackathon.leaders.usecase;

import esiea.hackathon.leaders.domain.Session;
import esiea.hackathon.leaders.domain.SessionRepository;
import lombok.RequiredArgsConstructor;

import java.util.List;

@RequiredArgsConstructor
public class StatsUseCase {
    private final SessionRepository sessionRepository;

    public GameStats getGameStats() {
        List<Session> sessions = sessionRepository.findAll();
        System.out.println("STATS DEBUG: Found " + sessions.size() + " total sessions");

        int inGame = 0;
        int inQueue = 0;

        for (Session session : sessions) {
            System.out.println("STATS DEBUG: Session " + session.getId() + " Status=" + session.getStatus() + " P1="
                    + (session.getPlayer1() != null) + " P2=" + (session.getPlayer2() != null));
            if (session.getStatus() == Session.SessionStatus.ACTIVE) {
                // In active game, likely 2 players
                int count = 0;
                if (session.getPlayer1() != null)
                    count++;
                if (session.getPlayer2() != null)
                    count++;
                inGame += count;
            } else if (session.getStatus() == Session.SessionStatus.WAITING_FOR_PLAYER) {
                // In queue, likely 1 player
                if (session.getPlayer1() != null)
                    inQueue++;
                if (session.getPlayer2() != null)
                    inQueue++;
            }
        }

        return new GameStats(inGame, inQueue);
    }

    public static class GameStats {
        private final int inGame;
        private final int inQueue;

        public GameStats(int inGame, int inQueue) {
            this.inGame = inGame;
            this.inQueue = inQueue;
        }

        public int getInGame() {
            return inGame;
        }

        public int getInQueue() {
            return inQueue;
        }
    }
}
