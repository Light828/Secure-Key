package com.locksmith.platform.service;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class StripeService {

    @Value("${stripe.api-key:}")
    private String stripeApiKey;

    @Value("${app.frontend-url:http://localhost:8081}")
    private String frontendUrl;

    public String createCheckoutSession(String orderId, long amountCents, String currency) throws StripeException {
        if (stripeApiKey == null || stripeApiKey.isEmpty()) {
            throw new IllegalStateException("Stripe API key not configured");
        }

        Stripe.apiKey = stripeApiKey;

        SessionCreateParams params = SessionCreateParams.builder()
                .addPaymentMethodType(SessionCreateParams.PaymentMethodType.CARD)
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(frontendUrl + "/cart?session_id={CHECKOUT_SESSION_ID}&status=success")
                .setCancelUrl(frontendUrl + "/cart?status=cancel")
                .addLineItem(
                        SessionCreateParams.LineItem.builder()
                                .setPriceData(
                                        SessionCreateParams.LineItem.PriceData.builder()
                                                .setCurrency(currency.toLowerCase())
                                                .setUnitAmount(amountCents)
                                                .setProductData(
                                                        SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                .setName("SecureKey Order #" + orderId)
                                                                .build()
                                                )
                                                .build()
                                )
                                .setQuantity(1L)
                                .build()
                )
                .setClientReferenceId(orderId)
                .build();

        Session session = Session.create(params);
        return session.getId();
    }

public Session retrieveSession(String sessionId) throws StripeException {
        if (stripeApiKey == null || stripeApiKey.isEmpty()) {
            throw new IllegalStateException("Stripe API key not configured");
        }

        Stripe.apiKey = stripeApiKey;
        return Session.retrieve(sessionId);
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

        PaymentIntent intent = PaymentIntent.create(params);
        return intent.getClientSecret();
    }
}
