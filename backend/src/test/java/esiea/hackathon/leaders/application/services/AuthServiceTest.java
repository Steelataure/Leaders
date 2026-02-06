package esiea.hackathon.leaders.application.services;

import esiea.hackathon.leaders.application.dto.request.LoginRequestDto;
import esiea.hackathon.leaders.application.dto.request.RegisterRequestDto;
import esiea.hackathon.leaders.application.dto.response.LoginResponseDto;
import esiea.hackathon.leaders.domain.model.UserCredentialsEntity;
import esiea.hackathon.leaders.domain.repository.UserCredentialsRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @InjectMocks
    private AuthService authService;
    @Mock
    private UserCredentialsRepository userCredentialsRepository;

    @Test
    @DisplayName("Register - email déjà utilisé")
    void register_takenEmail() {
        RegisterRequestDto request = new RegisterRequestDto(
                "test@gmail.com",
                "username",
                "abc123"
        );
        when(userCredentialsRepository.findByEmail(request.email()))
                .thenReturn(Optional.of(UserCredentialsEntity.builder().build()));
        assertThrows(IllegalArgumentException.class, () ->
                authService.register(request)
        );
    }

    @Test
    @DisplayName("Login - mot de passe incorrect")
    void login_wrongPassword() {
        LoginRequestDto request = new LoginRequestDto(
                "test@gmail.com",
                "abc123"
        );
        UserCredentialsEntity user = UserCredentialsEntity.builder()
                .password("123abc")
                .build();
        when(userCredentialsRepository.findByEmail(request.email()))
                .thenReturn(Optional.of(user));
        assertThrows(IllegalArgumentException.class, () ->
                authService.login(request)
        );
    }

    @Test
    @DisplayName("Login - succès")
    void login_sucess() {
        LoginRequestDto request = new LoginRequestDto(
                "test@gmail.com",
                "abc123"
        );
        UserCredentialsEntity user = UserCredentialsEntity.builder()
                .id(UUID.randomUUID())
                .email(request.email())
                .username("username")
                .password("abc123")
                .build();

        when(userCredentialsRepository.findByEmail(request.email()))
                .thenReturn(Optional.of(user));
        LoginResponseDto response = authService.login(request);

        assertNotNull(response.token());
        assertEquals(user.getUsername(), response.user().username());
    }


}