# Stripe Test Cards for Checkout Testing

Use these test card numbers on Stripe's hosted checkout page (appears after clicking "Pay with Stripe card"):

## Successful Payments
- **4242 4242 4242 4242** - Any future expiry (12/34), any CVC (123)
- Visa: 4242 4242 42424242

## Require Authentication (3DS)
- **4000 0000 0000 9995** - Triggers additional verification

## Card Declines
- **4000 0000 0000 0002** - Generic decline
- **4000 0000 0000 0341** - Insufficient funds / expired

## Other Scenarios
- **4000 0000 0000 3184** - Attach to customer (recurring)
- **5555 5555 5555 4444** - New card branding (Visa Debit)

**Full list:** [Stripe Testing Docs](https://docs.stripe.com/testing#cards)

**Backend expects:** Stripe test mode keys in spring-server application.yml. Production uses live keys.

Test flow:
1. Add items to cart at /shop
2. Go /cart → Pay with Stripe card
3. Enter test card → Success redirects /cart?status=success&session_id=...
4. Confirms order automatically
