package esiea.hackathon.leaders.adapter.controller;

import esiea.hackathon.leaders.application.dto.request.LoginRequestDto;
import esiea.hackathon.leaders.application.dto.request.RegisterRequestDto;
import esiea.hackathon.leaders.application.dto.response.LoginResponseDto;
import esiea.hackathon.leaders.application.services.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
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
}
