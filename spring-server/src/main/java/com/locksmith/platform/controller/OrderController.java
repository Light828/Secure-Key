package com.locksmith.platform.controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.locksmith.platform.dto.OrderSummaryView;
import com.locksmith.platform.service.OrderService;
import com.locksmith.platform.service.PayPalService;
import com.locksmith.platform.service.StripeService;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;

import jakarta.validation.constraints.NotBlank;

@RestController
@RequestMapping("/orders")
public class OrderController {

    private final OrderService orderService;
    private final StripeService stripeService;

    public OrderController(OrderService orderService, StripeService stripeService) {
        this.orderService = orderService;
        this.stripeService = stripeService;
    }

    @PostMapping("/create-paypal-order")
    public Map<String, Object> createPaypalOrder(@RequestHeader("Authorization") String authorization) {
        PayPalService.PayPalOrder order = orderService.createPaypalOrder(authorization);
        return Map.of(
                "paypalOrderId", order.paypalOrderId(),
                "approveLink", order.approveLink(),
                "amount", order.amount(),
                "currency", order.currency()
        );
    }

    @PostMapping("/capture-paypal-order")
    public Map<String, Object> capturePaypalOrder(@RequestHeader("Authorization") String authorization, @RequestBody CaptureRequest request) {
        OrderService.CaptureResult result = orderService.capturePaypalOrder(authorization, request.paypalOrderId());
        return Map.of("message", result.message(), "orderId", result.orderId());
    }

    @PostMapping("/create-stripe-checkout")
    public Map<String, Object> createStripeCheckout(@RequestHeader("Authorization") String authorization) {
        try {
            PayPalService.PayPalOrder order = orderService.createPaypalOrder(authorization);
            long amountInCents = order.amount().longValue();
            String orderId = "order-" + System.nanoTime();
            StripeService.CheckoutSessionResult result = stripeService.createCheckoutSession(
                    orderId,
                    amountInCents,
                    order.currency(),
                    "http://localhost:8081/cart",
                    "http://localhost:8081/cart",
                    "SecureKey Order: " + orderId
            );
            return Map.of(
                    "sessionId", result.sessionId(),
                    "url", result.url(),
                    "amount", order.amount(),
                    "currency", order.currency()
            );
        } catch (StripeException ex) {
            throw new RuntimeException("Failed to create Stripe checkout session: " + ex.getMessage());
        }
    }

    @PostMapping("/confirm-stripe-payment")
    public Map<String, Object> confirmStripePayment(@RequestHeader("Authorization") String authorization, @RequestBody StripePaymentRequest request) {
        try {
            Session session = stripeService.retrieveSession(request.sessionId());
            if (session == null) {
                throw new IllegalArgumentException("Stripe session not found");
            }

            // Parse delivery info from request
            String deliveryType = request.deliveryType() != null ? request.deliveryType() : "collect";
            String deliveryAddress = request.deliveryAddress();
            BigDecimal deliveryDistanceKm = request.deliveryDistanceKm() != null
                    ? new java.math.BigDecimal(request.deliveryDistanceKm()) : null;
            BigDecimal deliveryFee = request.deliveryFee() != null
                    ? new java.math.BigDecimal(request.deliveryFee()) : null;

            OrderService.CaptureResult result = orderService.captureStripePayment(
                    authorization,
                    request.sessionId(),
                    deliveryType,
                    deliveryAddress,
                    deliveryDistanceKm,
                    deliveryFee
            );
            return Map.of(
                    "message", result.message(),
                    "orderId", result.orderId(),
                    "sessionId", request.sessionId(),
                    "paymentStatus", "paid",
                    "stripePaymentStatus", String.valueOf(session.getPaymentStatus())
            );
        } catch (Exception ex) {
            throw new RuntimeException("Failed to confirm payment: " + ex.getMessage());
        }
    }

    public record StripePaymentRequest(
            String sessionId,
            String deliveryType,
            String deliveryAddress,
            Double deliveryDistanceKm,
            Double deliveryFee
            ) {

    }

    @GetMapping("/my-orders")
    public Map<String, List<OrderSummaryView>> getMyOrders(@RequestHeader("Authorization") String authorization) {
        return Map.of("orders", orderService.getMyOrders(authorization));
    }

    @GetMapping(value = {"/approve", "/approve/{paypalOrderId}"}, produces = MediaType.TEXT_HTML_VALUE)
    public String approvePage(@PathVariable(required = false) String paypalOrderId, @RequestParam(required = false) String mock) {
        String resolvedOrderId = paypalOrderId != null ? paypalOrderId : (mock != null ? "MOCK-ORDER" : "PENDING-ORDER");
        return buildApprovePage(resolvedOrderId);
    }

    private String buildApprovePage(String paypalOrderId) {
        String safeOrderId = escapeHtml(paypalOrderId);
        return """
                                <!doctype html>
                                <html lang="en">
                                <head>
                                    <meta charset="UTF-8" />
                                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                                    <title>SecureKey Bank Card Payment</title>
                                    <style>
                                        :root {
                                            color-scheme: dark;
                                            --bg: #0b0f14;
                                            --panel: #101722;
                                            --panel-2: #0e141d;
                                            --border: #253244;
                                            --text: #f3f6fb;
                                            --muted: #95a3b8;
                                            --gold: #f4b43a;
                                            --gold-2: #d98d00;
                                            --danger: #ff6b6b;
                                        }
                                        * { box-sizing: border-box; }
                                        body {
                                            margin: 0;
                                            min-height: 100vh;
                                            font-family: Inter, Arial, sans-serif;
                                            background: radial-gradient(circle at top, #172130 0%, var(--bg) 58%);
                                            color: var(--text);
                                            display: grid;
                                            place-items: center;
                                            padding: 24px;
                                        }
                                        .shell {
                                            width: min(760px, 100%);
                                            background: linear-gradient(180deg, rgba(16,23,34,.98), rgba(10,15,21,.98));
                                            border: 1px solid var(--border);
                                            border-radius: 24px;
                                            padding: 28px;
                                            box-shadow: 0 24px 80px rgba(0,0,0,.45);
                                        }
                                        .eyebrow {
                                            text-transform: uppercase;
                                            letter-spacing: .18em;
                                            color: var(--gold);
                                            font-size: .75rem;
                                            margin: 0 0 8px 0;
                                            font-weight: 700;
                                        }
                                        h1 {
                                            margin: 0;
                                            font-size: clamp(1.9rem, 4vw, 3rem);
                                            letter-spacing: .04em;
                                        }
                                        .sub {
                                            color: var(--muted);
                                            margin: 12px 0 0;
                                            line-height: 1.5;
                                        }
                                        .grid {
                                            display: grid;
                                            grid-template-columns: 1.15fr .85fr;
                                            gap: 20px;
                                            margin-top: 24px;
                                        }
                                        .card {
                                            background: linear-gradient(180deg, rgba(17,24,35,.96), rgba(13,18,26,.96));
                                            border: 1px solid var(--border);
                                            border-radius: 20px;
                                            padding: 20px;
                                        }
                                        label {
                                            display: block;
                                            font-size: .78rem;
                                            letter-spacing: .08em;
                                            text-transform: uppercase;
                                            color: var(--muted);
                                            margin-bottom: 8px;
                                        }
                                        input {
                                            width: 100%;
                                            border: 1px solid var(--border);
                                            background: #0b1119;
                                            color: var(--text);
                                            border-radius: 14px;
                                            padding: 14px 16px;
                                            font-size: 1rem;
                                            outline: none;
                                        }
                                        input:focus {
                                            border-color: rgba(244,180,58,.75);
                                            box-shadow: 0 0 0 4px rgba(244,180,58,.14);
                                        }
                                        .row { display: grid; grid-template-columns: 1.3fr .7fr .55fr; gap: 12px; }
                                        .actions {
                                            display: flex;
                                            gap: 12px;
                                            flex-wrap: wrap;
                                            align-items: center;
                                            margin-top: 18px;
                                        }
                                        button {
                                            border: 0;
                                            border-radius: 14px;
                                            padding: 14px 18px;
                                            font-weight: 700;
                                            cursor: pointer;
                                        }
                                        .primary {
                                            background: linear-gradient(180deg, var(--gold), var(--gold-2));
                                            color: #111;
                                            min-width: 180px;
                                        }
                                        .ghost {
                                            background: transparent;
                                            color: var(--text);
                                            border: 1px solid var(--border);
                                        }
                                        .note {
                                            margin-top: 14px;
                                            color: var(--muted);
                                            font-size: .92rem;
                                            line-height: 1.5;
                                        }
                                        .status {
                                            margin-top: 16px;
                                            display: none;
                                            border-radius: 14px;
                                            padding: 14px 16px;
                                            background: rgba(244,180,58,.12);
                                            border: 1px solid rgba(244,180,58,.28);
                                            color: var(--text);
                                        }
                                        .status.error {
                                            background: rgba(255,107,107,.12);
                                            border-color: rgba(255,107,107,.28);
                                            color: #ffd0d0;
                                        }
                                        .summary {
                                            display: grid;
                                            gap: 12px;
                                        }
                                        .summary-item {
                                            display: flex;
                                            justify-content: space-between;
                                            gap: 16px;
                                            padding: 14px 0;
                                            border-bottom: 1px solid rgba(37,50,68,.8);
                                        }
                                        .summary-item:last-child { border-bottom: 0; }
                                        .muted { color: var(--muted); }
                                        .brand-pill {
                                            display: inline-flex;
                                            align-items: center;
                                            gap: 8px;
                                            padding: 8px 12px;
                                            border-radius: 999px;
                                            background: rgba(244,180,58,.12);
                                            color: var(--gold);
                                            font-size: .85rem;
                                            font-weight: 700;
                                        }
                                        .success-panel {
                                            display: none;
                                            margin-top: 18px;
                                            padding: 18px;
                                            border-radius: 18px;
                                            border: 1px solid rgba(74,222,128,.24);
                                            background: rgba(34,197,94,.10);
                                        }
                                        .success-panel h2 {
                                            margin: 0 0 8px 0;
                                            font-size: 1.4rem;
                                        }
                                        .success-panel p {
                                            margin: 0;
                                            color: #d7f9e2;
                                            line-height: 1.6;
                                        }
                                        .success-actions {
                                            display: flex;
                                            gap: 12px;
                                            flex-wrap: wrap;
                                            margin-top: 14px;
                                        }
                                        @media (max-width: 760px) {
                                            .shell { padding: 20px; }
                                            .grid { grid-template-columns: 1fr; }
                                            .row { grid-template-columns: 1fr; }
                                        }
                                    </style>
                                </head>
                                <body>
                                    <main class="shell">
                                        <p class="eyebrow">Secure card checkout</p>
                                        <h1>Add your bank card to complete payment</h1>
                                        <p class="sub">This is the local development payment screen for order %s. Enter card details and approve the payment to continue.</p>
                                        <div class="grid">
                                            <section class="card">
                                                <form id="card-form">
                                                    <div style="margin-bottom:14px">
                                                        <label for="cardholder">Cardholder name</label>
                                                        <input id="cardholder" name="cardholder" autocomplete="cc-name" placeholder="John Smith" required />
                                                    </div>
                                                    <div style="margin-bottom:14px">
                                                        <label for="cardnumber">Card number</label>
                                                        <input id="cardnumber" name="cardnumber" inputmode="numeric" autocomplete="cc-number" placeholder="4111 1111 1111 1111" maxlength="19" required />
                                                    </div>
                                                    <div style="margin-bottom:14px">
                                                        <span id="card-brand" class="brand-pill">Card type: Unknown</span>
                                                    </div>
                                                    <div class="row">
                                                        <div>
                                                            <label for="expiry">Expiry</label>
                                                            <input id="expiry" name="expiry" autocomplete="cc-exp" placeholder="MM/YY" maxlength="5" required />
                                                        </div>
                                                        <div>
                                                            <label for="cvv">CVV</label>
                                                            <input id="cvv" name="cvv" inputmode="numeric" autocomplete="cc-csc" placeholder="123" maxlength="4" required />
                                                        </div>
                                                        <div>
                                                            <label for="zip">ZIP</label>
                                                            <input id="zip" name="zip" inputmode="numeric" autocomplete="postal-code" placeholder="0000" required />
                                                        </div>
                                                    </div>
                                                    <div class="actions">
                                                        <button class="primary" type="submit">Pay securely</button>
                                                        <button class="ghost" type="button" id="cancel-button">Cancel</button>
                                                    </div>
                                                    <p class="note">Use a test card such as 4111 1111 1111 1111, any future expiry, and any 4-digit ZIP while testing locally.</p>
                                                    <div id="status" class="status"></div>
                                                    <div id="success-panel" class="success-panel"></div>
                                                </form>
                                            </section>
                                            <aside class="card">
                                                <div class="summary">
                                                    <div>
                                                        <div class="muted" style="text-transform:uppercase;letter-spacing:.08em;font-size:.78rem">Order</div>
                                                        <div style="font-weight:700;margin-top:6px">#%s</div>
                                                    </div>
                                                    <div class="summary-item"><span class="muted">Payment method</span><strong>Bank card</strong></div>
                                                    <div class="summary-item"><span class="muted">Status</span><strong>Pending approval</strong></div>
                                                    <div class="summary-item"><span class="muted">Security</span><strong>Mock local checkout</strong></div>
                                                </div>
                                            </aside>
                                        </div>
                                    </main>
                                    <script>
                                        const status = document.getElementById('status');
                                        const form = document.getElementById('card-form');
                                        const cardNumber = document.getElementById('cardnumber');
                                        const expiry = document.getElementById('expiry');
                                        const cvv = document.getElementById('cvv');
                                        const zip = document.getElementById('zip');
                                        const cardBrand = document.getElementById('card-brand');
                                        const successPanel = document.getElementById('success-panel');
                                        const cancelButton = document.getElementById('cancel-button');

                                        function showStatus(message, error = false) {
                                            status.textContent = message;
                                            status.className = error ? 'status error' : 'status';
                                            status.style.display = 'block';
                                        }

                                        function detectCardBrand(value) {
                                            const digits = value.split('').filter((character) => character >= '0' && character <= '9').join('');
                                            if (digits.startsWith('4')) return 'Visa';
                                            if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard';
                                            if (/^3[47]/.test(digits)) return 'American Express';
                                            if (/^6(?:011|5|4[4-9])/.test(digits)) return 'Discover';
                                            return 'Unknown';
                                        }

                                        function updateCardBrand() {
                                            cardBrand.textContent = 'Card type: ' + detectCardBrand(cardNumber.value);
                                        }

                                        function showSuccess(orderId, brand, last4, zipValue) {
                                            successPanel.style.display = 'block';
                                            successPanel.innerHTML = `
                                                <h2>Payment approved</h2>
                                                <p>Your ${brand} card ending in ${last4} was approved for order <strong>#${orderId}</strong>.</p>
                                                <p style="margin-top:8px;color:#baf2cf">ZIP ${zipValue} verified. Return to the checkout tab to finalize and track your order.</p>
                                                <div class="success-actions">
                                                  <button type="button" class="primary" id="close-success">Close window</button>
                                                </div>
                                            `;
                                            const closeSuccess = document.getElementById('close-success');
                                            closeSuccess.addEventListener('click', () => window.close());
                                        }

                                        function luhnCheck(value) {
                                            const digits = value.split('').filter((character) => character >= '0' && character <= '9').join('');
                                            let sum = 0;
                                            let shouldDouble = false;
                                            for (let i = digits.length - 1; i >= 0; i--) {
                                                let digit = Number(digits[i]);
                                                if (Number.isNaN(digit)) return false;
                                                if (shouldDouble) {
                                                    digit *= 2;
                                                    if (digit > 9) digit -= 9;
                                                }
                                                sum += digit;
                                                shouldDouble = !shouldDouble;
                                            }
                                            return sum % 10 === 0;
                                        }

                                        cardNumber.addEventListener('input', (event) => {
                                            const value = event.target.value.replace(/[^0-9]/g, '').slice(0, 16);
                                            event.target.value = value.replace(/(.{4})/g, '$1 ').trim();
                                            updateCardBrand();
                                        });

                                        expiry.addEventListener('input', (event) => {
                                            const value = event.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                                            event.target.value = value.length > 2 ? value.slice(0, 2) + '/' + value.slice(2) : value;
                                        });

                                        cvv.addEventListener('input', (event) => {
                                            event.target.value = event.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                                        });

                                        zip.addEventListener('input', (event) => {
                                            event.target.value = event.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                                        });

                                        form.addEventListener('submit', (event) => {
                                            event.preventDefault();
                                            const name = document.getElementById('cardholder').value.trim();
                                            const number = cardNumber.value.split(' ').join('');
                                            const expiryValue = expiry.value.trim();
                                            const cvvValue = cvv.value.trim();
                                            const zipValue = zip.value.trim();
                                            const brand = detectCardBrand(number);

                                            if (!name || number.length < 13 || !luhnCheck(number)) {
                                                showStatus('Enter a valid bank card number.', true);
                                                return;
                                            }

                                            if (brand === 'Unknown') {
                                                showStatus('Enter a supported card type such as Visa or Mastercard.', true);
                                                return;
                                            }

                                            const expiryParts = expiryValue.split('/');
                                            const month = Number(expiryParts[0]);
                                            const yearSuffix = Number(expiryParts[1]);
                                            if (expiryParts.length !== 2 || Number.isNaN(month) || Number.isNaN(yearSuffix) || month < 1 || month > 12) {
                                                showStatus('Enter a valid expiry date in MM/YY format.', true);
                                                return;
                                            }

                                            const year = 2000 + yearSuffix;
                                            const now = new Date();
                                            const expiryDate = new Date(year, month, 0);
                                            if (expiryDate <= now) {
                                                showStatus('This card is expired.', true);
                                                return;
                                            }

                                            if (cvvValue.length < 3) {
                                                showStatus('Enter a valid CVV.', true);
                                                return;
                                            }

                                            if (zipValue.length !== 4 || zipValue.split('').some((character) => character < '0' || character > '9')) {
                                                showStatus('Enter a 4-digit ZIP code.', true);
                                                return;
                                            }

                                            showStatus('Card approved.');
                                            showSuccess('%s', brand, number.slice(-4), zipValue);
                                        });

                                        updateCardBrand();

                                        cancelButton.addEventListener('click', () => {
                                            window.close();
                                        });
                                    </script>
                                </body>
                                </html>
                                """.formatted(safeOrderId, safeOrderId, safeOrderId);
    }

    private String escapeHtml(String value) {
        if (value == null) {
            return "";
        }

        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    public record CaptureRequest(@NotBlank String paypalOrderId) {

    }
}
