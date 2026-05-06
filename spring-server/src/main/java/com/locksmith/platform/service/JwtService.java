package com.locksmith.platform.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private static final String HMAC_SHA256 = "HmacSHA256";

    private final ObjectMapper objectMapper;

    @Value("${app.jwt-secret:change-this-secret}")
    private String jwtSecret;

    @Value("${app.jwt-issuer:locksmith-platform}")
    private String issuer;

    @Value("${app.jwt-expiration-hours:168}")
    private long expirationHours;

    public JwtService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public String createToken(Long userId, String name, String email, String role) {
        Instant now = Instant.now();
        Instant expiresAt = now.plusSeconds(expirationHours * 3600);

        Map<String, Object> header = Map.of("alg", "HS256", "typ", "JWT");
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("sub", String.valueOf(userId));
        payload.put("name", name);
        payload.put("email", email);
        payload.put("role", role);
        payload.put("iss", issuer);
        payload.put("iat", now.getEpochSecond());
        payload.put("exp", expiresAt.getEpochSecond());

        try {
            String headerPart = base64Url(objectMapper.writeValueAsBytes(header));
            String payloadPart = base64Url(objectMapper.writeValueAsBytes(payload));
            String signature = sign(headerPart + "." + payloadPart);
            return headerPart + "." + payloadPart + "." + signature;
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to create JWT", ex);
        }
    }

    public JwtPrincipal requirePrincipal(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Missing authorization token");
        }

        String token = authorizationHeader.substring("Bearer ".length()).trim();
        if (token.isEmpty()) {
            throw new IllegalArgumentException("Missing authorization token");
        }

        return parse(token);
    }

    public JwtPrincipal requireAdmin(String authorizationHeader) {
        JwtPrincipal principal = requirePrincipal(authorizationHeader);
        if (!"admin".equalsIgnoreCase(principal.role())) {
            throw new IllegalArgumentException("Admin access required");
        }
        return principal;
    }

    private JwtPrincipal parse(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                throw new IllegalArgumentException("Invalid token format");
            }

            String expectedSignature = sign(parts[0] + "." + parts[1]);
            if (!constantTimeEquals(expectedSignature, parts[2])) {
                throw new IllegalArgumentException("Invalid token signature");
            }

            Map<?, ?> payload = objectMapper.readValue(Base64.getUrlDecoder().decode(parts[1]), Map.class);
            long exp = ((Number) payload.get("exp")).longValue();
            if (Instant.now().getEpochSecond() >= exp) {
                throw new IllegalArgumentException("Token expired");
            }

            Long userId = Long.valueOf(String.valueOf(payload.get("sub")));
            String name = String.valueOf(payload.get("name"));
            String email = String.valueOf(payload.get("email"));
            String role = String.valueOf(payload.get("role"));
            return new JwtPrincipal(userId, name, email, role);
        } catch (IllegalArgumentException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid token");
        }
    }

    private String sign(String input) throws Exception {
        Mac mac = Mac.getInstance(HMAC_SHA256);
        mac.init(new SecretKeySpec(jwtSecret.getBytes(StandardCharsets.UTF_8), HMAC_SHA256));
        return base64Url(mac.doFinal(input.getBytes(StandardCharsets.UTF_8)));
    }

    private String base64Url(byte[] data) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(data);
    }

    private boolean constantTimeEquals(String expected, String actual) {
        byte[] left = expected.getBytes(StandardCharsets.UTF_8);
        byte[] right = actual.getBytes(StandardCharsets.UTF_8);
        if (left.length != right.length) {
            return false;
        }

        int result = 0;
        for (int i = 0; i < left.length; i++) {
            result |= left[i] ^ right[i];
        }
        return result == 0;
    }

    public record JwtPrincipal(Long userId, String name, String email, String role) {
    }
}
