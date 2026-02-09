package esiea.hackathon.leaders.application.services;

import esiea.hackathon.leaders.domain.model.UserCredentialsEntity;
import esiea.hackathon.leaders.domain.repository.UserCredentialsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EloService {

    private final UserCredentialsRepository userCredentialsRepository;
    private static final int K_FACTOR = 32;

    @Transactional
    public void updateElo(UUID winnerUserId, UUID loserUserId) {
        if (winnerUserId == null || loserUserId == null) {
            System.out.println("ELO: One of the players is a guest. No ELO update.");
            return;
        }

        Optional<UserCredentialsEntity> winnerOpt = userCredentialsRepository.findById(winnerUserId);
        Optional<UserCredentialsEntity> loserOpt = userCredentialsRepository.findById(loserUserId);

        if (winnerOpt.isPresent() && loserOpt.isPresent()) {
            UserCredentialsEntity winner = winnerOpt.get();
            UserCredentialsEntity loser = loserOpt.get();

            int winnerElo = winner.getElo();
            int loserElo = loser.getElo();

            // expected score
            double expectedWinnerProgress = 1.0 / (1.0 + Math.pow(10, (loserElo - winnerElo) / 400.0));
            double expectedLoserProgress = 1.0 / (1.0 + Math.pow(10, (winnerElo - loserElo) / 400.0));

            // New ratings
            int newWinnerElo = (int) Math.round(winnerElo + K_FACTOR * (1.0 - expectedWinnerProgress));
            int newLoserElo = (int) Math.round(loserElo + K_FACTOR * (0.0 - expectedLoserProgress));

            winner.setElo(newWinnerElo);
            loser.setElo(newLoserElo);

            userCredentialsRepository.save(winner);
            userCredentialsRepository.save(loser);

            System.out
                    .println("ELO UPDATED: " + winner.getUsername() + " (" + winnerElo + " -> " + newWinnerElo + ") vs "
                            + loser.getUsername() + " (" + loserElo + " -> " + newLoserElo + ")");
        } else {
            System.out.println("ELO: One or both authenticated users not found in repository. No update.");
        }
    }
}
