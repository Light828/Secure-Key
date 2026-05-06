import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Phone, ChevronRight, ZoomIn } from "lucide-react";
import GalleryLightbox from "@/components/GalleryLightbox";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import heroLock from "@/assets/hero-locksmith.jpg";

export const Route = createFileRoute("/gallery")({
  component: GalleryPage,
  head: () => ({
    meta: [
      { title: "Gallery | SecureKey Locksmith Witbank" },
      {
        name: "description",
        content:
          "View our portfolio of locksmith work in Witbank — lock installations, car key programming, access control systems, and more.",
      },
      { property: "og:title", content: "Our Work — SecureKey Locksmith Witbank" },
      {
        property: "og:description",
        content: "Browse photos of recent locksmith projects across Witbank and eMalahleni.",
      },
    ],
  }),
});

const projects = [
  {
    title: "Commercial Access Control",
    category: "Commercial",
    desc: "Full access control system installation for a Witbank office park — card readers, electric strikes, and central management software.",
    imageUrl: heroLock,
  },
  {
    title: "BMW Key Programming",
    category: "Automotive",
    desc: "Programmed a replacement transponder key for a BMW 3 Series after the client lost all keys. Completed on-site in 45 minutes.",
    imageUrl: heroLock,
  },
  {
    title: "High-Security Deadbolt Install",
    category: "Residential",
    desc: "Upgraded all entry points of a family home with Mul-T-Lock high-security deadbolts and restricted key profiles.",
    imageUrl: heroLock,
  },
  {
    title: "Master Key System",
    category: "Commercial",
    desc: "Designed and installed a 4-level master key system for a 30-room guesthouse in eMalahleni.",
    imageUrl: heroLock,
  },
  {
    title: "Safe Cracking & Reset",
    category: "Safe Services",
    desc: "Successfully opened a Chubbsafes commercial safe after combination failure, then reset with a new code.",
    imageUrl: heroLock,
  },
  {
    title: "Gate Motor & Intercom",
    category: "Residential",
    desc: "Installed a CENTURION D5-Evo gate motor with GSM intercom system for a residential complex in Del Judor.",
    imageUrl: heroLock,
  },
  {
    title: "Emergency Break-In Repair",
    category: "Emergency",
    desc: "Responded to a break-in at 3am — replaced damaged locks, reinforced the door frame, and secured all entry points.",
    imageUrl: heroLock,
  },
  {
    title: "Fleet Key Management",
    category: "Automotive",
    desc: "Cut and programmed 25 spare keys for a Witbank logistics company's fleet of delivery vehicles.",
    imageUrl: heroLock,
  },
  {
    title: "Panic Bar Installation",
    category: "Commercial",
    desc: "Fitted panic bars and fire-rated exit devices for a school in Witbank, ensuring SANS compliance.",
    imageUrl: heroLock,
  },
];

const categories = ["All", ...Array.from(new Set(projects.map((p) => p.category)))];

function GalleryPage() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredProjects =
    activeCategory === "All"
      ? projects
      : projects.filter((p) => p.category === activeCategory);

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
            <span className="text-xs tracking-widest text-primary uppercase">Our Work</span>
            <h1 className="text-5xl font-bold mt-2 text-foreground">
              Project <span className="text-gradient-gold">Gallery</span>
            </h1>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              A selection of recent jobs across Witbank and eMalahleni — from emergency lockouts to full security installations.
            </p>
          </motion.div>

          {/* Category pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 text-xs tracking-wider rounded-full border transition-colors ${
                  activeCategory === cat
                    ? "bg-primary/20 border-primary/40 text-primary"
                    : "border-border text-muted-foreground bg-card hover:border-primary/40 hover:text-primary"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project, i) => {
              const originalIndex = projects.indexOf(project);
              return (
                <motion.div
                  key={project.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="group bg-card rounded-xl border border-border overflow-hidden hover:border-primary/40 transition-all hover:shadow-gold cursor-pointer"
                  onClick={() => setLightboxIndex(originalIndex)}
                >
                  <div className="h-48 bg-gradient-to-br from-surface to-surface-elevated flex items-center justify-center relative">
                    {project.imageUrl ? (
                      <img src={project.imageUrl} alt={project.title} className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <div className="h-12 w-12 mx-auto rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                          <span className="text-primary text-lg font-bold">
                            {project.category.charAt(0)}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground tracking-wider uppercase">
                          {project.category}
                        </span>
                      </div>
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="flex items-center gap-2 text-sm text-primary font-medium">
                        <ZoomIn className="h-5 w-5" />
                        View Details
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-foreground">{project.title}</h3>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-2">
                      {project.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-surface">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold text-foreground">Need Similar Work Done?</h2>
          <p className="mt-3 text-muted-foreground">Get a free quote for any locksmith or security project.</p>
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
              Request a Quote <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <GalleryLightbox
          items={projects}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
