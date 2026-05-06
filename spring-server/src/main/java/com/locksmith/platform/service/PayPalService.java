package com.locksmith.platform.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class PayPalService {

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper;

    @Value("${paypal.client-id:}")
    private String clientId;

    @Value("${paypal.client-secret:}")
    private String clientSecret;

    @Value("${paypal.base-url:https://api-m.sandbox.paypal.com}")
    private String baseUrl;

    @Value("${paypal.currency:ZAR}")
    private String currency;

    @Value("${app.skip-verification:false}")
    private boolean isDevMode;

    private volatile String accessToken;
    private volatile Instant tokenExpiresAt;

    public PayPalService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public PayPalOrder createOrder(BigDecimal total, String approvalReturnUrl) {
        // In dev mode without credentials, return a mock order
        if (isDevMode && (clientId == null || clientId.isBlank() || clientSecret == null || clientSecret.isBlank())) {
            String mockOrderId = "MOCK-" + System.currentTimeMillis();
            String mockApproveLink = approvalReturnUrl + "/" + mockOrderId + "?mock=true";
            return new PayPalOrder(mockOrderId, mockApproveLink, total, currency);
        }
        
        ensureCredentials();
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("intent", "CAPTURE");
            payload.put("purchase_units", new Object[]{Map.of(
                    "amount", Map.of(
                            "currency_code", currency,
                        "value", total.setScale(2, RoundingMode.HALF_UP).toPlainString()
                    )
            )});
            payload.put("application_context", Map.of(
                    "return_url", approvalReturnUrl,
                    "cancel_url", approvalReturnUrl
            ));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/v2/checkout/orders"))
                    .header("Authorization", "Bearer " + getAccessToken())
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload), StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 300) {
                throw new IllegalStateException("PayPal order creation failed: " + response.body());
            }

            JsonNode body = objectMapper.readTree(response.body());
            String paypalOrderId = body.path("id").asText(null);
            String approveLink = null;
            for (JsonNode link : body.path("links")) {
                if ("approve".equalsIgnoreCase(link.path("rel").asText())) {
                    approveLink = link.path("href").asText(null);
                    break;
                }
            }

            if (paypalOrderId == null || approveLink == null) {
                throw new IllegalStateException("PayPal order response missing approval data");
            }

            return new PayPalOrder(paypalOrderId, approveLink, total, currency);
        } catch (IOException | InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Unable to create PayPal order", ex);
        }
    }

    public String captureOrder(String paypalOrderId) {
        // In dev mode, accept mock orders
        if (isDevMode && paypalOrderId.startsWith("MOCK-")) {
            return paypalOrderId;
        }
        
        ensureCredentials();
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/v2/checkout/orders/" + paypalOrderId + "/capture"))
                    .header("Authorization", "Bearer " + getAccessToken())
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.noBody())
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 300) {
                throw new IllegalStateException("PayPal capture failed: " + response.body());
            }

            JsonNode body = objectMapper.readTree(response.body());
            return body.path("id").asText(paypalOrderId);
        } catch (IOException | InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Unable to capture PayPal order", ex);
        }
    }

    private String getAccessToken() throws IOException, InterruptedException {
        if (accessToken != null && tokenExpiresAt != null && Instant.now().isBefore(tokenExpiresAt.minus(Duration.ofSeconds(30)))) {
            return accessToken;
        }

        String credentials = Base64.getEncoder().encodeToString((clientId + ":" + clientSecret).getBytes(StandardCharsets.UTF_8));
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/v1/oauth2/token"))
                .header("Authorization", "Basic " + credentials)
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString("grant_type=client_credentials", StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 300) {
            throw new IllegalStateException("PayPal token request failed: " + response.body());
        }

        JsonNode body = objectMapper.readTree(response.body());
        accessToken = body.path("access_token").asText(null);
        long expiresIn = body.path("expires_in").asLong(300);
        tokenExpiresAt = Instant.now().plusSeconds(expiresIn);
        if (accessToken == null || accessToken.isBlank()) {
            throw new IllegalStateException("PayPal token missing from response");
        }
        return accessToken;
    }

    private void ensureCredentials() {
        if (clientId == null || clientId.isBlank() || clientSecret == null || clientSecret.isBlank()) {
            throw new IllegalStateException("PayPal credentials are not configured");
        }
    }

    public record PayPalOrder(String paypalOrderId, String approveLink, BigDecimal amount, String currency) {
    }
}
