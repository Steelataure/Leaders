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

    public record EloResult(int winnerDelta, int loserDelta) {
    }

    private final UserCredentialsRepository userCredentialsRepository;
    private static final int K_FACTOR = 32;

    public EloResult calculateEloDelta(int winnerElo, int loserElo) {
        double expectedWinner = 1.0 / (1.0 + Math.pow(10, (loserElo - winnerElo) / 400.0));
        double expectedLoser = 1.0 / (1.0 + Math.pow(10, (winnerElo - loserElo) / 400.0));

        int newWinner = (int) Math.round(winnerElo + K_FACTOR * (1.0 - expectedWinner));
        int newLoser = (int) Math.round(loserElo + K_FACTOR * (0.0 - expectedLoser));

        return new EloResult(newWinner - winnerElo, newLoser - loserElo);
    }

    @Transactional
    public Optional<EloResult> updateElo(UUID winnerUserId, UUID loserUserId) {
        if (winnerUserId == null || loserUserId == null) {
            System.out.println("ELO: One of the players is a guest. No ELO update.");
            return Optional.empty();
        }

        Optional<UserCredentialsEntity> winnerOpt = userCredentialsRepository.findById(winnerUserId);
        Optional<UserCredentialsEntity> loserOpt = userCredentialsRepository.findById(loserUserId);

        if (winnerOpt.isPresent() && loserOpt.isPresent()) {
            UserCredentialsEntity winner = winnerOpt.get();
            UserCredentialsEntity loser = loserOpt.get();

            int winnerElo = winner.getElo();
            int loserElo = loser.getElo();

            EloResult result = calculateEloDelta(winnerElo, loserElo);

            winner.setElo(winnerElo + result.winnerDelta());
            loser.setElo(loserElo + result.loserDelta());

            userCredentialsRepository.save(winner);
            userCredentialsRepository.save(loser);

            System.out
                    .println("ELO UPDATED: " + winner.getUsername() + " (" + winnerElo + " -> "
                            + (winnerElo + result.winnerDelta()) + ") vs "
                            + loser.getUsername() + " (" + loserElo + " -> " + (loserElo + result.loserDelta()) + ")");

            return Optional.of(result);
        } else {
            System.out.println("ELO: One or both authenticated users not found in repository. No update.");
            return Optional.empty();
        }
    }
}
