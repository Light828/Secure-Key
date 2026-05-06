import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Award, Users, Clock, Shield, Phone, Mail } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "About Us | SecureKey Locksmith Witbank" },
      { name: "description", content: "Learn about SecureKey Locksmith — Witbank's trusted lock and security experts since 2010. Licensed, insured, and always available." },
      { property: "og:title", content: "About Us — SecureKey Locksmith Witbank" },
      { property: "og:description", content: "Meet the team behind Witbank's most trusted locksmith service." },
    ],
  }),
});

const values = [
  { icon: Clock, title: "Reliability", desc: "We show up fast — 30 minutes on average — and finish the job right." },
  { icon: Shield, title: "Trust", desc: "Fully licensed and insured. Your property's security is our priority." },
  { icon: Award, title: "Expertise", desc: "15+ years of experience with the latest tools and techniques." },
  { icon: Users, title: "Community", desc: "Proudly serving Witbank, eMalahleni, and surrounding Mpumalanga towns." },
];

const team = [
  {
    name: "David Molefe",
    role: "Founder & Lead Technician",
    bio: "With over 15 years in the security industry, David founded SecureKey to bring reliable, honest locksmith services to Witbank. PSIRA certified and SALA registered.",
  },
  {
    name: "Lindiwe Nkosi",
    role: "Operations Manager",
    bio: "Lindiwe ensures every callout runs smoothly — from dispatch to follow-up. She's the friendly voice when you call SecureKey.",
  },
  {
    name: "Johan van der Merwe",
    role: "Automotive Specialist",
    bio: "Johan specialises in transponder key programming and auto lockouts. Factory-trained on European and Japanese vehicle systems.",
  },
  {
    name: "Sipho Dlamini",
    role: "Commercial & Access Control",
    bio: "Sipho designs and installs master key systems and electronic access control for businesses across eMalahleni.",
  },
  {
    name: "Thandi Mabaso",
    role: "Safe Technician",
    bio: "Certified safe technician with training in manipulation, drilling, and combination resetting for all major safe brands.",
  },
  {
    name: "Pieter Botha",
    role: "Emergency Response",
    bio: "Pieter handles after-hours and emergency calls. Known for his 25-minute average response time across Witbank.",
  },
];

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Story */}
      <section className="pt-28 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <span className="text-xs tracking-widest text-primary uppercase">Our Story</span>
            <h1 className="text-5xl font-bold mt-2 text-foreground">
              About <span className="text-gradient-gold">SecureKey</span>
            </h1>
            <p className="mt-6 text-muted-foreground leading-relaxed">
              SecureKey Locksmith was founded in 2010 by a team of security professionals who saw a
              need for reliable, affordable locksmith services in the Witbank area. What started as a
              small mobile operation has grown into eMalahleni's most trusted lock and security company.
            </p>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Over the past 15 years, we've completed over 10,000 jobs — from simple lockouts to
              complex commercial access control systems. Our technicians are trained in the latest
              security technologies and carry a full range of tools and key blanks, so most jobs are
              completed in a single visit.
            </p>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              We're proud members of the South African Locksmith Association and hold all required
              PSIRA certifications. When you call SecureKey, you're getting qualified, vetted professionals.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-surface">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">Our Values</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 bg-card rounded-xl border border-border text-center"
              >
                <div className="h-12 w-12 mx-auto rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <v.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground">{v.title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-xs tracking-widest text-primary uppercase">The Team</span>
            <h2 className="text-3xl font-bold mt-2 text-foreground">
              Meet Our <span className="text-gradient-gold">Experts</span>
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Every member of our team is qualified, PSIRA-registered, and passionate about keeping Witbank secure.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {team.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="p-6 bg-card rounded-xl border border-border hover:border-primary/30 transition-colors"
              >
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <span className="text-lg font-bold text-primary">
                    {member.name.split(" ").map((n) => n[0]).join("")}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground">{member.name}</h3>
                <p className="text-xs text-primary font-semibold tracking-wider uppercase mt-1">
                  {member.role}
                </p>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                  {member.bio}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-surface">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold text-foreground">Work With Us</h2>
          <p className="mt-3 text-muted-foreground">
            Ready to secure your property? Get in touch with our team today.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <a
              href="tel:+27131001234"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-gold text-primary-foreground font-semibold rounded-lg shadow-gold hover:scale-105 transition-transform"
            >
              <Phone className="h-5 w-5" />
              Call Us
            </a>
            <a
              href="mailto:info@securekeywitbank.co.za"
              className="inline-flex items-center gap-2 px-6 py-3 border border-border text-foreground font-semibold rounded-lg hover:border-primary/50 transition-colors"
            >
              <Mail className="h-5 w-5" />
              Email Us
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
