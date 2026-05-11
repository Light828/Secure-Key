package com.locksmith.platform.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.stripe.Stripe;
import com.stripe.exception.ApiConnectionException;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.model.checkout.Session;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.checkout.SessionCreateParams;

import jakarta.annotation.PostConstruct;

@Service
public class StripeService {

    private static final Logger logger = LoggerFactory.getLogger(StripeService.class);

    public record CheckoutSessionResult(String sessionId, String url) {

    }

    @Value("${stripe.api-key:}")
    private String stripeApiKey;

    @Value("${app.frontend-url:http://localhost:8081}")
    private String frontendUrl;

    @PostConstruct
    @SuppressWarnings("unused")
    void configureNetworking() {
        System.setProperty("java.net.preferIPv4Stack", "true");
        System.setProperty("java.net.preferIPv6Addresses", "false");
    }

    public CheckoutSessionResult createCheckoutSession(String orderId, long amountCents, String currency, String successUrl, String cancelUrl, String description) throws StripeException {
        if (stripeApiKey == null || stripeApiKey.isEmpty()) {
            throw new IllegalStateException("Stripe API key not configured");
        }

        Stripe.apiKey = stripeApiKey;

        String resolvedSuccessUrl = successUrl == null || successUrl.isBlank()
                ? frontendUrl + "/cart?session_id={CHECKOUT_SESSION_ID}&status=success"
                : successUrl;
        String resolvedCancelUrl = cancelUrl == null || cancelUrl.isBlank()
                ? frontendUrl + "/cart?status=cancel"
                : cancelUrl;
        String resolvedDescription = description == null || description.isBlank()
                ? "SecureKey Order #" + orderId
                : description;

        SessionCreateParams params = SessionCreateParams.builder()
                .addPaymentMethodType(SessionCreateParams.PaymentMethodType.CARD)
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(resolvedSuccessUrl)
                .setCancelUrl(resolvedCancelUrl)
                .addLineItem(
                        SessionCreateParams.LineItem.builder()
                                .setPriceData(
                                        SessionCreateParams.LineItem.PriceData.builder()
                                                .setCurrency(currency.toLowerCase())
                                                .setUnitAmount(amountCents)
                                                .setProductData(
                                                        SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                .setName(resolvedDescription)
                                                                .build()
                                                )
                                                .build()
                                )
                                .setQuantity(1L)
                                .build()
                )
                .setClientReferenceId(orderId)
                .build();

        // Retry logic with exponential backoff for transient Stripe API connection failures
        int attempts = 0;
        int maxAttempts = 3;
        long waitMs = 500;
        while (true) {
            try {
                Session session = Session.create(params);
                return new CheckoutSessionResult(session.getId(), session.getUrl());
            } catch (ApiConnectionException ace) {
                attempts++;
                logger.warn("Stripe API connection error creating checkout session (attempt {}/{}): {}", attempts, maxAttempts, ace.getMessage());
                if (attempts >= maxAttempts) {
                    throw ace;
                }
                try {
                    Thread.sleep(waitMs);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException(ie);
                }
                waitMs *= 2;
            }
        }
    }

    public String createCheckoutSession(String orderId, long amountCents, String currency) throws StripeException {
        CheckoutSessionResult session = createCheckoutSession(orderId, amountCents, currency, null, null, null);
        return session.sessionId();
    }

    public Session retrieveSession(String sessionId) throws StripeException {
        if (stripeApiKey == null || stripeApiKey.isEmpty()) {
            throw new IllegalStateException("Stripe API key not configured");
        }

        Stripe.apiKey = stripeApiKey;
        int attempts = 0;
        int maxAttempts = 3;
        long waitMs = 500;
        while (true) {
            try {
                return Session.retrieve(sessionId);
            } catch (ApiConnectionException ace) {
                attempts++;
                logger.warn("Stripe API connection error retrieving session (attempt {}/{}): {}", attempts, maxAttempts, ace.getMessage());
                if (attempts >= maxAttempts) {
                    throw ace;
                }
                try {
                    Thread.sleep(waitMs);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException(ie);
                }
                waitMs *= 2;
            }
        }
    }

    public String createPaymentIntent(long amountCents, String currency, String orderId) throws StripeException {
        if (stripeApiKey == null || stripeApiKey.isEmpty()) {
            throw new IllegalStateException("Stripe API key not configured");
        }

        Stripe.apiKey = stripeApiKey;

        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(amountCents)
                .setCurrency(currency.toLowerCase())
                .build();

        // Retry logic with exponential backoff for transient Stripe API connection failures
        int attempts = 0;
        int maxAttempts = 3;
        long waitMs = 500;
        while (true) {
            try {
                PaymentIntent intent = PaymentIntent.create(params);
                return intent.getClientSecret();
            } catch (ApiConnectionException ace) {
                attempts++;
                logger.warn("Stripe API connection error creating payment intent (attempt {}/{}): {}", attempts, maxAttempts, ace.getMessage());
                if (attempts >= maxAttempts) {
                    throw ace;
                }
                try {
                    Thread.sleep(waitMs);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException(ie);
                }
                waitMs *= 2;
            }
        }
    }
}
