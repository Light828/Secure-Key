import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Phone, ChevronRight } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const Route = createFileRoute("/faq")({
  component: FAQPage,
  head: () => ({
    meta: [
      { title: "FAQ | SecureKey Locksmith Witbank" },
      {
        name: "description",
        content:
          "Frequently asked questions about locksmith services in Witbank. Find answers about pricing, response times, and emergency services.",
      },
      { property: "og:title", content: "FAQ — SecureKey Locksmith Witbank" },
      {
        property: "og:description",
        content:
          "Common questions answered about our locksmith services in Witbank & eMalahleni.",
      },
    ],
  }),
});

const faqs = [
  {
    category: "Emergency Services",
    items: [
      {
        q: "How quickly can you get to me in an emergency?",
        a: "Our average response time is 30 minutes within Witbank and eMalahleni. For surrounding areas in Mpumalanga, it may take up to 45–60 minutes depending on distance.",
      },
      {
        q: "Do you charge extra for after-hours or weekend callouts?",
        a: "We have a standard callout fee for after-hours emergencies (evenings, weekends, and public holidays). We'll always quote you upfront before starting any work — no hidden fees.",
      },
      {
        q: "I'm locked out of my car at night — can you help?",
        a: "Absolutely. We operate 24/7, 365 days a year. Call us any time and a qualified automotive locksmith will be dispatched immediately.",
      },
    ],
  },
  {
    category: "Pricing & Payment",
    items: [
      {
        q: "How much does a locksmith callout cost?",
        a: "Our standard callout fee starts from R350 during business hours. The total cost depends on the job — we always provide a full quote before starting. Visit our Pricing page for estimates.",
      },
      {
        q: "Do you offer free quotes?",
        a: "Yes! Call us or send a message through our contact form and we'll give you a no-obligation estimate based on your situation.",
      },
      {
        q: "What payment methods do you accept?",
        a: "We accept cash, EFT/bank transfer, and card payments (Visa & Mastercard) on-site via our mobile card machine.",
      },
    ],
  },
  {
    category: "Services",
    items: [
      {
        q: "Can you make a car key if I've lost all my keys?",
        a: "Yes. We can cut and program new transponder keys for most vehicle makes and models, even if you have no existing key. We'll need your vehicle's VIN number and proof of ownership.",
      },
      {
        q: "Do you install security gates and burglar bars?",
        a: "We specialise in locks, access control, and gate motors. For security gates and burglar bars, we can recommend trusted partners in the Witbank area.",
      },
      {
        q: "Can you open a safe if I've forgotten the combination?",
        a: "Yes. Our technicians are trained in safe manipulation and drilling techniques. We can open most residential and commercial safes and reset the combination for you.",
      },
      {
        q: "Do you handle access control and intercom systems?",
        a: "Yes, we install and maintain access control systems, intercoms, electric strikes, and magnetic locks for commercial and residential properties.",
      },
    ],
  },
  {
    category: "About Us",
    items: [
      {
        q: "Are your locksmiths licensed and insured?",
        a: "Yes. All our technicians hold valid PSIRA registration and are fully insured. We're also proud members of the South African Locksmith Association (SALA).",
      },
      {
        q: "What areas do you serve?",
        a: "We serve Witbank (eMalahleni), Middelburg, Secunda, Standerton, Bethal, and the greater Mpumalanga Highveld region.",
      },
      {
        q: "Do you offer a guarantee on your work?",
        a: "Yes. All our workmanship comes with a 90-day guarantee. If you experience any issues with a lock or key we've fitted, we'll return and fix it at no charge.",
      },
    ],
  },
];

function FAQPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-28 pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-14"
          >
            <span className="text-xs tracking-widest text-primary uppercase">
              Help Centre
            </span>
            <h1 className="text-5xl font-bold mt-2 text-foreground">
              Frequently Asked{" "}
              <span className="text-gradient-gold">Questions</span>
            </h1>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Everything you need to know about our locksmith services. Can't
              find your answer? Give us a call.
            </p>
          </motion.div>

          <div className="space-y-10">
            {faqs.map((section, si) => (
              <motion.div
                key={section.category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: si * 0.05 }}
              >
                <h2 className="text-xl font-bold text-foreground mb-4">
                  {section.category}
                </h2>
                <Accordion type="single" collapsible className="space-y-2">
                  {section.items.map((faq, fi) => (
                    <AccordionItem
                      key={fi}
                      value={`${si}-${fi}`}
                      className="bg-card border border-border rounded-xl px-5 data-[state=open]:border-primary/30"
                    >
                      <AccordionTrigger className="text-sm text-foreground font-medium hover:no-underline text-left">
                        {faq.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                        {faq.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-surface">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold text-foreground">
            Still Have Questions?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Our team is ready to help. Call us or send a message anytime.
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
