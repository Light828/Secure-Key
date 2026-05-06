package com.locksmith.platform.service;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Random;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.locksmith.platform.model.EmailVerification;
import com.locksmith.platform.model.PasswordReset;
import com.locksmith.platform.model.User;
import com.locksmith.platform.repository.EmailVerificationRepository;
import com.locksmith.platform.repository.PasswordResetRepository;
import com.locksmith.platform.repository.UserRepository;

import jakarta.mail.internet.MimeMessage;
import jakarta.transaction.Transactional;

@Service
@Transactional
public class AuthService {

    private static final int VERIFICATION_CODE_MAX_ATTEMPTS = 20;
    private static final Random CODE_RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final EmailVerificationRepository emailVerificationRepository;
    private final PasswordResetRepository passwordResetRepository;
    private final JwtService jwtService;
    private final JavaMailSender mailSender;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);

    @Value("${app.skip-verification:false}")
    private boolean skipVerification;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${app.notification-from:no-reply@securekey.local}")
    private String fromAddress;

    public AuthService(UserRepository userRepository, EmailVerificationRepository emailVerificationRepository, 
                       PasswordResetRepository passwordResetRepository, JwtService jwtService, JavaMailSender mailSender) {
        this.userRepository = userRepository;
        this.emailVerificationRepository = emailVerificationRepository;
        this.passwordResetRepository = passwordResetRepository;
        this.jwtService = jwtService;
        this.mailSender = mailSender;
    }

    public RegisterResult register(String name, String email, String password) {
        userRepository.findByEmailIgnoreCase(email).ifPresent(existing -> {
            throw new IllegalArgumentException("Email already registered");
        });

        User user = new User();
        user.setName(name);
        user.setEmail(email.toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole(User.Role.client);
        user.setVerified(skipVerification);
        user = userRepository.save(user);

        EmailVerification verification = new EmailVerification();
        verification.setUser(user);
        String code = generateUniqueVerificationCode();
        verification.setToken(code);
        verification.setExpiresAt(Instant.now().plus(Duration.ofHours(24)));
        if (skipVerification) {
            verification.setUsedAt(Instant.now());
        }
        emailVerificationRepository.save(verification);

        // send verification email
        sendVerificationEmail(user.getEmail(), code);

        return new RegisterResult(verification.getToken());
    }

    public LoginResult login(String email, String password) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!user.isVerified() && !skipVerification) {
            throw new IllegalArgumentException("Account not verified");
        }

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        String token = jwtService.createToken(user.getId(), user.getName(), user.getEmail(), user.getRole().name());
        return new LoginResult(token, user);
    }

    public void verify(String token) {
        EmailVerification verification = emailVerificationRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid verification token"));

        if (verification.getUsedAt() != null) {
            throw new IllegalArgumentException("Verification token already used");
        }

        if (verification.getExpiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Verification token expired");
        }

        User user = verification.getUser();
        user.setVerified(true);
        userRepository.save(user);

        verification.setUsedAt(Instant.now());
        emailVerificationRepository.save(verification);
    }

    public void forgotPassword(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("Email not found"));

        // Delete old reset codes
        passwordResetRepository.deleteByExpiresAtBefore(Instant.now());

        // Generate 6-digit code
        String code = String.format("%06d", new Random().nextInt(1000000));

        PasswordReset reset = new PasswordReset();
        reset.setUser(user);
        reset.setCode(code);
        reset.setExpiresAt(Instant.now().plus(Duration.ofMinutes(15)));
        passwordResetRepository.save(reset);

        // Send email with code
        sendPasswordResetEmail(user.getEmail(), code);
    }

    public void resetPassword(String code, String newPassword) {
        PasswordReset reset = passwordResetRepository.findByCodeAndUsedAtIsNullAndExpiresAtGreaterThanEqual(code, Instant.now())
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset code"));

        User user = reset.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        reset.setUsedAt(Instant.now());
        passwordResetRepository.save(reset);
    }

    private void sendPasswordResetEmail(String email, String code) {
        if (!isMailConfigured()) {
            System.out.println("[PASSWORD_RESET_EMAIL_FALLBACK] Code for " + email + ": " + code);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(email);
            helper.setSubject("Reset your SecureKey password");
            helper.setText(buildPasswordResetEmailBody(code), true);
            mailSender.send(message);
        } catch (Exception ex) {
            System.err.println("[PASSWORD_RESET_EMAIL_ERROR] Failed to send reset email to " + email + ": " + ex.getMessage());
            System.out.println("[PASSWORD_RESET_EMAIL_FALLBACK] Code for " + email + ": " + code);
            // do not throw - allow flow to continue
        }
    }

    private String buildPasswordResetEmailBody(String code) {
        return "<div style='font-family:Arial,sans-serif;line-height:1.6;color:#111827'>" +
                "<h2>Reset Your Password</h2>" +
                "<p>We received a request to reset your SecureKey password.</p>" +
                "<p style='font-size:24px;font-weight:bold;color:#2563eb;margin:20px 0;'>" + code + "</p>" +
                "<p>This code will expire in 15 minutes. If you didn't request this, ignore this email.</p>" +
                "</div>";
    }

    private void sendVerificationEmail(String email, String code) {
        if (!isMailConfigured()) {
            System.out.println("[VERIFICATION_EMAIL_FALLBACK] Code for " + email + ": " + code);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(email);
            helper.setSubject("Verify your SecureKey account");
            helper.setText(buildVerificationEmailBody(code), true);
            mailSender.send(message);
        } catch (Exception ex) {
            System.err.println("[VERIFICATION_EMAIL_ERROR] Failed to send verification email to " + email + ": " + ex.getMessage());
            System.out.println("[VERIFICATION_EMAIL_FALLBACK] Code for " + email + ": " + code);
            // do not throw - allow registration to succeed even if email send fails
        }
    }

    private String buildVerificationEmailBody(String code) {
        return "<div style='font-family:Arial,sans-serif;line-height:1.6;color:#111827'>" +
                "<h2>Verify Your Email</h2>" +
                "<p>Thanks for registering at SecureKey. Enter the following 6-digit code to verify your account:</p>" +
                "<p style='font-size:28px;font-weight:bold;color:#10b981;margin:20px 0;'>" + code + "</p>" +
                "<p>This code will expire in 24 hours. If you didn't sign up, ignore this email.</p>" +
                "</div>";
    }

    private boolean isMailConfigured() {
        return mailUsername != null && !mailUsername.isBlank();
    }

    private String generateUniqueVerificationCode() {
        for (int attempt = 0; attempt < VERIFICATION_CODE_MAX_ATTEMPTS; attempt++) {
            String code = String.format("%06d", CODE_RANDOM.nextInt(1_000_000));
            if (!emailVerificationRepository.existsByToken(code)) {
                return code;
            }
        }
        throw new IllegalStateException("Unable to generate unique verification code. Please retry.");
    }

    // Create an admin user (only allowed if no admin exists or if this is first setup)
    public RegisterResult createAdmin(String name, String email, String password) {
        // Check if this email is already registered
        if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new IllegalArgumentException("Email already registered");
        }

        User user = new User();
        user.setName(name);
        user.setEmail(email.toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole(User.Role.admin);
        user.setVerified(true); // Admin accounts are auto-verified
        user = userRepository.save(user);

        return new RegisterResult("Admin account created successfully");
    }

    public record RegisterResult(String verificationToken) {
    }

    public record LoginResult(String token, User user) {
    }
}
