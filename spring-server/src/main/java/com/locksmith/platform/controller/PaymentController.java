package com.locksmith.platform.controller;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.locksmith.platform.service.StripeService;
import com.stripe.exception.StripeException;

@RestController
@RequestMapping("/payments")
public class PaymentController {

    @Autowired
    private StripeService stripeService;
    @Autowired
    private com.locksmith.platform.service.OrderService orderService;

    public static record CreateSessionRequest(Long amountCents, String successUrl, String cancelUrl, String description) {

    }

    public static record CreateIntentRequest(Long amountCents, String currency, String description) {

    }

    @PostMapping("/create-checkout-session")
    public Map<String, String> createCheckoutSession(@RequestHeader(value = "Authorization", required = false) String authorization, @RequestBody CreateSessionRequest req) {
        Long maybe = req.amountCents();
        long amount = maybe != null ? maybe : 1000L;
        String success = req.successUrl() == null ? "http://localhost:8081/" : req.successUrl();
        String cancel = req.cancelUrl() == null ? "http://localhost:8081/" : req.cancelUrl();
        String desc = req.description() == null ? "SecureKey payment" : req.description();

        try {
            String orderId = "order-" + System.currentTimeMillis();
            StripeService.CheckoutSessionResult session = stripeService.createCheckoutSession(orderId, amount, "ZAR", success, cancel, desc);
            String url = session.url();
            String sessionId = session.sessionId();
            if (url == null || sessionId == null) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Stripe did not return a checkout url or session id");
            }

            // If user is authenticated, create a pending order record so it appears in history immediately
            if (authorization != null && !authorization.isBlank()) {
                try {
                    java.math.BigDecimal total = java.math.BigDecimal.valueOf(amount).divide(java.math.BigDecimal.valueOf(100));
                    // use "STRIPE-<sessionId>" as the stored paypal_order_id so confirm later can find it
                    orderService.createStripePendingOrder(authorization, "STRIPE-" + sessionId, total, "ZAR", null, null, null, null);
                } catch (Exception ex) {
                    // log but don't fail checkout creation
                    System.err.println("Warning: failed to create pending order: " + ex.getMessage());
                }
            }

            return Map.of("url", url, "sessionId", sessionId);
        } catch (StripeException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Stripe error: " + ex.getMessage(), ex);
        } catch (RuntimeException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to create checkout session", ex);
        }
    }

    @PostMapping("/create-mock-session")
    public Map<String, String> createMockSession(@RequestBody CreateSessionRequest req) {
        String success = req.successUrl() == null ? "/" : req.successUrl();
        String cancel = req.cancelUrl() == null ? "/" : req.cancelUrl();
        Long maybe = req.amountCents();
        long amount = maybe != null ? maybe : 1000L;
        String desc = req.description() == null ? "Mock payment" : req.description();

        String url = String.format("/mock-checkout?amount=%d&description=%s&success=%s&cancel=%s",
                amount,
                URLEncoder.encode(desc, StandardCharsets.UTF_8),
                URLEncoder.encode(success, StandardCharsets.UTF_8),
                URLEncoder.encode(cancel, StandardCharsets.UTF_8)
        );

        return Map.of("url", url);
    }

    @PostMapping("/create-payment-intent")
    public Map<String, String> createPaymentIntent(@RequestBody CreateIntentRequest req) {
        try {
            String orderId = "order-" + System.currentTimeMillis();
            String clientSecret = stripeService.createPaymentIntent(req.amountCents(), req.currency(), orderId);
            return Map.of("client_secret", clientSecret);
        } catch (StripeException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Stripe error: " + ex.getMessage());
        }
    }
}
