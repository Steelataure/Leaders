package esiea.hackathon.leaders.adapter.controller;

import esiea.hackathon.leaders.application.dto.request.LoginRequestDto;
import esiea.hackathon.leaders.application.dto.request.RegisterRequestDto;
import esiea.hackathon.leaders.application.dto.response.LoginResponseDto;
import esiea.hackathon.leaders.application.services.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<LoginResponseDto> register(@RequestBody RegisterRequestDto request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDto> login(@RequestBody LoginRequestDto request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<esiea.hackathon.leaders.application.dto.response.UserDto> getProfile(
            @RequestParam java.util.UUID userId) {
        return ResponseEntity.ok(authService.getUserProfile(userId));
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<java.util.List<esiea.hackathon.leaders.application.dto.response.UserDto>> getLeaderboard() {
        return ResponseEntity.ok(authService.getLeaderboard());
    }

    @PatchMapping("/avatar")
    public ResponseEntity<esiea.hackathon.leaders.application.dto.response.UserDto> updateAvatar(
            @RequestParam java.util.UUID userId,
            @RequestParam String avatar) {
        return ResponseEntity.ok(authService.updateAvatar(userId, avatar));
    }
}
