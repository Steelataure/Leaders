package esiea.hackathon.leaders.application.services;

import esiea.hackathon.leaders.application.dto.AuthResponseDto;
import esiea.hackathon.leaders.application.dto.LoginDto;
import esiea.hackathon.leaders.application.dto.RegisterDto;
import esiea.hackathon.leaders.domain.model.UserCredentialsEntity;
import esiea.hackathon.leaders.domain.repository.UserCredentialsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserCredentialsRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthResponseDto register(RegisterDto request) {
        if (repository.existsByEmail(request.email())) {
            throw new RuntimeException("Email already taken");
        }

        var user = UserCredentialsEntity.builder()
                .username(request.username())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .build();

        repository.save(user);
        var token = jwtService.generateToken(user);
        return new AuthResponseDto(token);
    }

    public AuthResponseDto login(LoginDto request) {
        var user = repository.findByEmail(request.email())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        var token = jwtService.generateToken(user);
        return new AuthResponseDto(token);
    }
}
