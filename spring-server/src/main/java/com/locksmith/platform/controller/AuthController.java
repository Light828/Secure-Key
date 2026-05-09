package com.locksmith.platform.controller;

import com.locksmith.platform.model.User;
import com.locksmith.platform.service.AuthService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public Map<String, Object> register(@Valid @RequestBody RegisterRequest request) {
        try {
            AuthService.RegisterResult result = authService.register(request.name(), request.email(), request.password());
            return Map.of(
                    "message", "Registration successful. Verify your account using the token sent to email.",
                    "verificationToken", result.verificationToken()
            );
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    @PostMapping("/verify")
    public Map<String, String> verify(@Valid @RequestBody VerifyRequest request) {
        try {
            authService.verify(request.token());
            return Map.of("message", "Account verified successfully.");
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthService.LoginResult result = authService.login(request.email(), request.password());
            User user = result.user();
            return ResponseEntity.ok(Map.of(
                    "token", result.token(),
                    "user", Map.of(
                            "id", user.getId(),
                            "name", user.getName(),
                            "email", user.getEmail(),
                            "role", user.getRole().name()
                    )
            ));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, ex.getMessage());
        }
    }

    @PostMapping("/forgot-password")
    public Map<String, String> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            authService.forgotPassword(request.email());
            return Map.of("message", "Password reset code sent to your email. Valid for 15 minutes.");
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    @PostMapping("/reset-password")
    public Map<String, String> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            authService.resetPassword(request.code(), request.newPassword());
            return Map.of("message", "Password reset successfully. You can now login with your new password.");
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    @PostMapping("/create-admin")
    public Map<String, Object> createAdmin(@Valid @RequestBody CreateAdminRequest request) {
        try {
            AuthService.RegisterResult result = authService.createAdmin(request.name(), request.email(), request.password());
            return Map.of(
                    "message", result.verificationToken(),
                    "email", request.email()
            );
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    public record RegisterRequest(@NotBlank String name, @Email String email, @NotBlank String password) {

    }

    public record VerifyRequest(@NotBlank String token) {

    }

    public record LoginRequest(@Email String email, @NotBlank String password) {

    }

    public record ForgotPasswordRequest(@Email String email) {

    }

    public record ResetPasswordRequest(@NotBlank String code, @NotBlank String newPassword) {

    }

    public record CreateAdminRequest(@NotBlank String name, @Email String email, @NotBlank String password) {

    }
}
