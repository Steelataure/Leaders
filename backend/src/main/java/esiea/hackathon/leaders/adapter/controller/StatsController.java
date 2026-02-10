package esiea.hackathon.leaders.adapter.controller;

import esiea.hackathon.leaders.usecase.StatsUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/stats")
@RequiredArgsConstructor
public class StatsController {

    private final StatsUseCase statsUseCase;

    @GetMapping
    public ResponseEntity<StatsUseCase.GameStats> getStats() {
        return ResponseEntity.ok(statsUseCase.getGameStats());
    }
}
