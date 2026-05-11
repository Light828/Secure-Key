import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Phone, ChevronRight, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
  head: () => ({
    meta: [
      { title: "Pricing | SecureKey Locksmith Witbank" },
      {
        name: "description",
        content:
          "Transparent locksmith pricing in Witbank. See estimated costs for lockouts, key cutting, lock changes, and more. No hidden fees.",
      },
      { property: "og:title", content: "Pricing — SecureKey Locksmith Witbank" },
      {
        property: "og:description",
        content: "Fair and transparent locksmith pricing across Witbank and eMalahleni.",
      },
    ],
  }),
});

const pricingCategories = [
  {
    title: "Emergency Lockouts",
    items: [
      { service: "House / flat lockout", price: "R350 – R650" },
      { service: "Car lockout (standard)", price: "R450 – R800" },
      { service: "Car lockout (high-security)", price: "R800 – R1,500" },
      { service: "Office / commercial lockout", price: "R500 – R900" },
      { service: "After-hours surcharge", price: "+ R150 – R250" },
    ],
  },
  {
    title: "Key Cutting & Duplication",
    items: [
      { service: "Standard house key copy", price: "R50 – R100" },
      { service: "Dimple / security key copy", price: "R150 – R350" },
      { service: "Car key cut (blade only)", price: "R200 – R500" },
      { service: "Transponder key (cut + program)", price: "R800 – R2,500" },
      { service: "Gate remote duplication", price: "R250 – R500" },
    ],
  },
  {
    title: "Lock Installation & Repair",
    items: [
      { service: "Standard lock change", price: "R450 – R800" },
      { service: "Deadbolt installation", price: "R550 – R1,000" },
      { service: "High-security lock (Mul-T-Lock)", price: "R1,200 – R3,000" },
      { service: "Lock rekeying (per lock)", price: "R250 – R450" },
      { service: "Break-in damage repair", price: "R600 – R1,500" },
    ],
  },
  {
    title: "Commercial & Safes",
    items: [
      { service: "Master key system (per lock)", price: "R350 – R600" },
      { service: "Access control (per door)", price: "R2,500 – R5,000" },
      { service: "Panic bar installation", price: "R1,500 – R3,000" },
      { service: "Safe opening", price: "R800 – R3,000" },
      { service: "Combination change", price: "R350 – R700" },
    ],
  },
];

const inclusions = [
  "Free telephonic quotes",
  "No hidden call-out fees",
  "Upfront pricing before we start",
  "90-day workmanship guarantee",
  "Card & EFT payments accepted",
  "VAT-inclusive pricing",
];

function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-28 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-14"
          >
            <span className="text-xs tracking-widest text-primary uppercase">
              Transparent Pricing
            </span>
            <h1 className="text-5xl font-bold mt-2 text-foreground">
              Our <span className="text-gradient-gold">Pricing</span>
            </h1>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Fair, upfront pricing with no surprises. Prices are estimates — call for an exact quote based on your situation.
            </p>
          </motion.div>

          {/* What's Included */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-14 max-w-3xl mx-auto"
          >
            {inclusions.map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </motion.div>

          {/* Pricing Tables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pricingCategories.map((cat, ci) => (
              <motion.div
                key={cat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: ci * 0.05 }}
                className="bg-card rounded-2xl border border-border/60 overflow-hidden hover:shadow-gold transition-shadow"
              >
                <div className="px-6 py-6 border-b border-border bg-gradient-to-r from-surface/80 to-surface-elevated/10">
                  <h2 className="text-lg font-semibold tracking-wider text-foreground uppercase">
                    {cat.title}
                  </h2>
                </div>
                <div className="divide-y divide-border">
                  {cat.items.map((item) => (
                    <div
                      key={item.service}
                      className="flex items-center justify-between px-6 py-4 hover:bg-background/5 transition-colors"
                    >
                      <span className="text-sm text-muted-foreground">
                        {item.service}
                      </span>
                      <span className="text-sm font-bold text-primary whitespace-nowrap ml-4">
                        {item.price}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-8">
            * All prices are estimates in ZAR and include VAT. Final pricing depends on the specific job, lock type, and time of service.
          </p>
        </div>
      </section>


      {/* CTA */}
      <section className="py-16 bg-surface">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold text-foreground">
            Get an Exact Quote
          </h2>
          <p className="mt-3 text-muted-foreground">
            Call now for a free, no-obligation quote tailored to your specific needs.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <a
              href="tel:+27131001234"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-gold text-primary-foreground font-semibold rounded-lg shadow-gold hover:scale-105 transition-transform"
            >
              Call now
            </a>

            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 border border-border text-foreground font-semibold rounded-lg hover:border-primary/50 transition-colors"
            >
              Send a Message <ChevronRight className="h-4 w-4" />
            </Link>
            <button
              onClick={async () => {
                try {
                  const resp = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/payments/create-checkout-session`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amountCents: 1000, description: 'Test payment', successUrl: `${window.location.origin}/cart?status=success&session_id={CHECKOUT_SESSION_ID}`, cancelUrl: window.location.href }),
                  });
                  if (!resp.ok) throw new Error('Server error');
                  const json = await resp.json();
                  if (json.url) window.location.href = json.url;
                  else {
                    // fallback to mock session
                    const mock = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/payments/create-mock-session`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ amountCents: 1000, description: 'Mock payment', successUrl: `${window.location.origin}/cart?status=success&session_id={CHECKOUT_SESSION_ID}`, cancelUrl: window.location.href }),
                    });
                    const j = await mock.json();
                    if (j.url) window.location.href = j.url;
                    else alert('Failed to create checkout session');
                  }
                } catch (err) {
                  // try mock session when stripe fails
                  try {
                    const mock = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/payments/create-mock-session`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ amountCents: 1000, description: 'Mock payment', successUrl: `${window.location.origin}/cart?status=success&session_id={CHECKOUT_SESSION_ID}`, cancelUrl: window.location.href }),
                    });
                    const j = await mock.json();
                    if (j.url) window.location.href = j.url;
                    else alert('Payment failed: ' + (err as Error).message);
                  } catch (e) {
                    alert('Payment failed: ' + (err as Error).message);
                  }
                }
              }}
              className="inline-flex items-center gap-2 px-6 py-3 border border-primary text-primary font-semibold rounded-lg hover:bg-primary/10 transition-colors"
            >
              Pay R10 (test)
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
