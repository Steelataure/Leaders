package esiea.hackathon.leaders.application.services;

import esiea.hackathon.leaders.application.dto.request.LoginRequestDto;
import esiea.hackathon.leaders.application.dto.request.RegisterRequestDto;
import esiea.hackathon.leaders.application.dto.response.LoginResponseDto;
import esiea.hackathon.leaders.application.dto.response.UserDto;
import esiea.hackathon.leaders.domain.model.UserCredentialsEntity;
import esiea.hackathon.leaders.domain.repository.UserCredentialsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserCredentialsRepository userCredentialsRepository;

    public LoginResponseDto register(RegisterRequestDto request) {
        if (userCredentialsRepository.findByEmail(request.email()).isPresent()) {
            throw new IllegalArgumentException("Email already taken");
        }
        if (userCredentialsRepository.findByUsername(request.username()).isPresent()) {
            throw new IllegalArgumentException("Username already taken");
        }

        UserCredentialsEntity user = UserCredentialsEntity.builder()
                .email(request.email())
                .username(request.username())
                .password(request.password()) // TODO: Hash password when Security is added
                .build();

        user = userCredentialsRepository.save(user);

        return createLoginResponse(user);
    }

    public LoginResponseDto login(LoginRequestDto request) {
        Optional<UserCredentialsEntity> userOpt = userCredentialsRepository.findByEmail(request.email());
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        UserCredentialsEntity user = userOpt.get();
        if (!user.getPassword().equals(request.password())) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        return createLoginResponse(user);
    }

    public UserDto getUserProfile(UUID userId) {
        UserCredentialsEntity user = userCredentialsRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return new UserDto(
                user.getId(),
                user.getEmail(),
                user.getUsername(),
                user.getElo(),
                user.getAvatar(),
                List.of("USER"));
    }

    public UserDto updateAvatar(UUID userId, String avatar) {
        UserCredentialsEntity user = userCredentialsRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setAvatar(avatar);
        user = userCredentialsRepository.save(user);
        return mapToDto(user);
    }

    public List<UserDto> getLeaderboard() {
        java.util.List<UserDto> leaderboard = new java.util.ArrayList<>();
        userCredentialsRepository.findTop10ByOrderByEloDesc().forEach(user -> {
            leaderboard.add(mapToDto(user));
        });
        return leaderboard;
    }

    private UserDto mapToDto(UserCredentialsEntity user) {
        return new UserDto(
                user.getId(),
                user.getEmail(),
                user.getUsername(),
                user.getElo(),
                user.getAvatar(),
                List.of("USER"));
    }

    private LoginResponseDto createLoginResponse(UserCredentialsEntity user) {
        // DUMMY IMPLEMENTATION: No real JWT/Security yet
        String dummyToken = "dummy-token-" + UUID.randomUUID();

        UserDto userDto = mapToDto(user);

        return new LoginResponseDto(dummyToken, userDto);
    }
}
