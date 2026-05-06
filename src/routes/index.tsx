import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Shield, Key, Car, Home, Clock, Phone, Star, ChevronRight } from "lucide-react";
import heroImg from "@/assets/hero-locksmith.jpg";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "SecureKey Locksmith Witbank | 24/7 Emergency Locksmith" },
      { name: "description", content: "Witbank's most trusted locksmith. 24/7 emergency service for automotive, residential, and commercial locks. Fast response across eMalahleni." },
    ],
  }),
});

const services = [
  { icon: Car, title: "Automotive", desc: "Car lockouts, key cutting, transponder programming & ignition repair." },
  { icon: Home, title: "Residential", desc: "Lock changes, rekeying, deadbolts, high-security locks & gate motors." },
  { icon: Shield, title: "Commercial", desc: "Master key systems, access control, safes & panic bar installation." },
  { icon: Key, title: "Key Cutting", desc: "Standard, dimple, tubular & high-security keys cut on site." },
];

const stats = [
  { value: "15+", label: "Years Experience" },
  { value: "10K+", label: "Jobs Completed" },
  { value: "24/7", label: "Emergency Service" },
  { value: "30min", label: "Avg Response Time" },
];

const testimonials = [
  { name: "Thabo M.", text: "Locked out at 2am and they arrived in 20 minutes. Lifesavers!", rating: 5 },
  { name: "Sarah V.", text: "Professional service. Installed a master key system for my business perfectly.", rating: 5 },
  { name: "James K.", text: "Best locksmith in Witbank. Fair prices and excellent workmanship.", rating: 5 },
];

function Index() {
  const [locationState, setLocationState] = useState<{ status: "idle" | "detecting" | "ready" | "error"; label: string }>({
    status: "idle",
    label: "Witbank / eMalahleni",
  });

  const resolveCityName = async (latitude: number, longitude: number) => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to resolve city");
    }

    const payload = (await response.json()) as {
      address?: {
        city?: string;
        town?: string;
        village?: string;
        municipality?: string;
        county?: string;
        state?: string;
      };
      display_name?: string;
    };

    return (
      payload.address?.city ||
      payload.address?.town ||
      payload.address?.village ||
      payload.address?.municipality ||
      payload.address?.county ||
      payload.address?.state ||
      payload.display_name?.split(",")[0] ||
      "Witbank / eMalahleni"
    );
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationState({ status: "error", label: "Location detection not supported" });
      return;
    }

    setLocationState((previous) => ({ ...previous, status: "detecting", label: "Detecting your current location..." }));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const city = await resolveCityName(position.coords.latitude, position.coords.longitude);
          setLocationState({
            status: "ready",
            label: city,
          });
        } catch {
          setLocationState({
            status: "error",
            label: "Witbank / eMalahleni",
          });
        }
      },
      () => {
        setLocationState({ status: "error", label: "Witbank / eMalahleni" });
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
    );
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative h-screen flex items-center overflow-hidden">
        <img
          src={heroImg}
          alt="Professional locksmith at work"
          width={1920}
          height={1080}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 hero-overlay" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <span className="inline-block px-3 py-1 text-xs tracking-widest bg-primary/20 text-primary rounded-full mb-6 border border-primary/30">
              {locationState.status === "detecting" ? "DETECTING LOCATION" : `SERVING ${locationState.label.toUpperCase()}`}
            </span>
            <p className="mb-4 inline-flex items-center rounded-full border border-border bg-background/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm">
              {locationState.status === "detecting" ? "Detecting your current location..." : `Current location: ${locationState.label}`}
            </p>
            <h1 className="text-5xl sm:text-7xl font-bold leading-tight">
              <span className="text-foreground">LOCKED</span>{" "}
              <span className="text-gradient-gold">OUT?</span>
              <br />
              <span className="text-foreground">WE'RE ON</span>{" "}
              <span className="text-gradient-gold">THE WAY.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-lg">
              24/7 emergency locksmith service across Witbank and eMalahleni.
              Fast, professional, and affordable.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="tel:+27131001234"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-gold text-primary-foreground font-semibold rounded-lg shadow-gold transition-transform hover:scale-105"
              >
                <Phone className="h-5 w-5" />
                Call Now
              </a>
              <Link
                to="/services"
                className="inline-flex items-center gap-2 px-6 py-3 border border-border text-foreground font-semibold rounded-lg hover:border-primary/50 transition-colors"
              >
                Our Services
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="py-8 text-center border-r border-border last:border-r-0"
              >
                <div className="text-3xl font-heading font-bold text-gradient-gold">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1 tracking-wider uppercase">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="text-xs tracking-widest text-primary uppercase">What We Do</span>
            <h2 className="text-4xl font-bold mt-2 text-foreground">Our Services</h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-6 bg-card rounded-xl border border-border hover:border-primary/40 transition-all hover:shadow-gold"
              >
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <s.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground">{s.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              to="/services"
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-gold-light transition-colors"
            >
              View all services <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section className="py-20 bg-surface">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-xs tracking-widest text-primary uppercase">Why Choose Us</span>
              <h2 className="text-4xl font-bold mt-2 text-foreground">
                Trusted By<br />
                <span className="text-gradient-gold">Thousands</span>
              </h2>
              <div className="mt-8 space-y-4">
                {[
                  "Licensed & insured professionals",
                  "30-minute average response time",
                  "Upfront pricing — no hidden fees",
                  "Latest tools & technology",
                  "Serving Witbank & surrounding areas",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 mt-8 text-sm text-primary hover:text-gold-light transition-colors"
              >
                Learn more about us <ChevronRight className="h-4 w-4" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              {testimonials.map((t) => (
                <div key={t.name} className="p-5 bg-card rounded-xl border border-border">
                  <div className="flex gap-1 mb-2">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-primary fill-primary" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground italic">"{t.text}"</p>
                  <p className="text-xs text-foreground font-semibold mt-3">— {t.name}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative p-10 md:p-16 rounded-2xl bg-gradient-gold text-center overflow-hidden"
          >
            <div className="relative z-10">
              <Clock className="h-10 w-10 mx-auto text-primary-foreground/80 mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground">
                Emergency? We're Available 24/7
              </h2>
              <p className="mt-3 text-primary-foreground/80 max-w-lg mx-auto">
                Don't panic. Our locksmiths are on standby across Witbank ready to help you right now.
              </p>
              <a
                href="tel:+27131001234"
                className="inline-flex items-center gap-2 mt-8 px-8 py-4 bg-background text-foreground font-semibold rounded-lg hover:bg-surface-elevated transition-colors"
              >
                <Phone className="h-5 w-5" />
                013 100 1234
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
