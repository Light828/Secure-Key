import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Car, Home, Shield, Key, Wrench, Lock, Phone, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import commercialAccessControl from "@/assets/commercial-access-control.jpg";

export const Route = createFileRoute("/services")({
  component: ServicesPage,
  head: () => ({
    meta: [
      { title: "Services | SecureKey Locksmith Witbank" },
      { name: "description", content: "Full range of locksmith services in Witbank: automotive, residential, commercial, key cutting, safe opening & emergency lockouts." },
    ],
  }),
});

const services = [
  {
    icon: Car,
    title: "Automotive Locksmith",
    items: [
      "Car & truck lockouts",
      "Transponder key programming",
      "Ignition repair & replacement",
      "Broken key extraction",
      "Spare car key cutting",
    ],
  },
  {
    icon: Home,
    title: "Residential Locksmith",
    items: [
      "House lockouts",
      "Lock changes & rekeying",
      "Deadbolt installation",
      "Gate motor & intercom systems",
      "Window lock fitting",
    ],
  },
  {
    icon: Shield,
    title: "Commercial Locksmith",
    image: commercialAccessControl,
    description: "Full access control system installation for an office park in Witbank — card readers, electric strikes, and central management software.",
    items: [
      "Master key systems",
      "Access control installation",
      "Panic bar & exit device fitting",
      "High-security lock upgrades",
      "Office lockouts",
    ],
  },
  {
    icon: Key,
    title: "Key Cutting",
    items: [
      "Standard & security keys",
      "Dimple & tubular keys",
      "Padlock keys",
      "Gate remote duplication",
      "Key-alike services",
    ],
  },
  {
    icon: Lock,
    title: "Safe Services",
    items: [
      "Safe opening & cracking",
      "Combination changes",
      "New safe supply & install",
      "Safe repair & maintenance",
      "Fireproof safe consultation",
    ],
  },
  {
    icon: Wrench,
    title: "Emergency 24/7",
    items: [
      "After-hours lockouts",
      "Break-in damage repair",
      "Urgent lock replacement",
      "Emergency boarding up",
      "Holiday & weekend service",
    ],
  },
];

function ServicesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-28 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-xs tracking-widest text-primary uppercase">What We Offer</span>
            <h1 className="text-5xl font-bold mt-2 text-foreground">Our Services</h1>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              From emergency lockouts to full security upgrades — we handle every lock challenge in Witbank.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/40 hover:shadow-gold"
              >
                {s.image && (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={s.image}
                      alt="Commercial access control installation"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute left-4 bottom-4 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-white backdrop-blur-sm">
                      Office park security
                    </div>
                  </div>
                )}
                <div className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <s.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">{s.title}</h2>
                  {s.description && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {s.description}
                    </p>
                  )}
                  <ul className="mt-4 space-y-2">
                    {s.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-surface">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold text-foreground">Need a Quote?</h2>
          <p className="mt-3 text-muted-foreground">
            Call us for a free, no-obligation quote on any locksmith service.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <a
              href="tel:+27131001234"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-gold text-primary-foreground font-semibold rounded-lg shadow-gold hover:scale-105 transition-transform"
            >
              <Phone className="h-5 w-5" />
              Call 013 100 1234
            </a>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 border border-border text-foreground font-semibold rounded-lg hover:border-primary/50 transition-colors"
            >
              Send a Message <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
