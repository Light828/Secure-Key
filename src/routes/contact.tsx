import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, Send, MessageCircle } from "lucide-react";
import { useState } from "react";
import { addEnquiry } from "@/lib/enquiries";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  head: () => ({
    meta: [
      { title: "Contact Us | SecureKey Locksmith Witbank" },
      { name: "description", content: "Get in touch with SecureKey Locksmith in Witbank. Call 013 100 1234 for 24/7 emergency service or send us a message." },
    ],
  }),
});

interface FormData {
  name: string;
  phone: string;
  email: string;
  service: string;
  message: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  service?: string;
}

function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    phone: "",
    email: "",
    service: "",
    message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    else if (!/^[\d\s+()-]{7,15}$/.test(formData.phone.trim()))
      newErrors.phone = "Enter a valid phone number";
    if (!formData.service) newErrors.service = "Please select a service";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const sendViaWhatsApp = () => {
    const phone = "27131001234";
    const text = [
      `*New Enquiry from Website*`,
      `*Name:* ${formData.name}`,
      `*Phone:* ${formData.phone}`,
      formData.email ? `*Email:* ${formData.email}` : "",
      `*Service:* ${formData.service}`,
      formData.message ? `*Message:* ${formData.message}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(text)}`,
      "_blank"
    );
  };

  const sendViaEmail = () => {
    const subject = encodeURIComponent(
      `Website Enquiry: ${formData.service} — ${formData.name}`
    );
    const body = encodeURIComponent(
      [
        `Name: ${formData.name}`,
        `Phone: ${formData.phone}`,
        formData.email ? `Email: ${formData.email}` : "",
        `Service: ${formData.service}`,
        formData.message ? `\nMessage:\n${formData.message}` : "",
      ]
        .filter(Boolean)
        .join("\n")
    );
    window.location.href = `mailto:info@securekeywitbank.co.za?subject=${subject}&body=${body}`;
  };

  const handleSubmit = async (e: React.FormEvent, method: "whatsapp" | "email") => {
    e.preventDefault();
    if (!validate()) return;
    // Save to database
    await addEnquiry({
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      service: formData.service,
      message: formData.message,
    });
    if (method === "whatsapp") {
      sendViaWhatsApp();
    } else {
      sendViaEmail();
    }
    setSubmitted(true);
  };

  const contactInfo = [
    { icon: MapPin, label: "Address", value: "23 Mandela St, Witbank, Mpumalanga, 1035" },
    { icon: Phone, label: "Phone", value: "013 100 1234", href: "tel:+27131001234" },
    { icon: Mail, label: "Email", value: "info@securekeywitbank.co.za", href: "mailto:info@securekeywitbank.co.za" },
    { icon: Clock, label: "Hours", value: "24/7 — Emergency service always available" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-28 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-14"
          >
            <span className="text-xs tracking-widest text-primary uppercase">Get In Touch</span>
            <h1 className="text-5xl font-bold mt-2 text-foreground">Contact Us</h1>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Locked out? Need a quote? Reach out — we respond fast.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-10">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              {contactInfo.map((c) => (
                <div key={c.label} className="flex items-start gap-4 p-4 bg-card rounded-xl border border-border">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <c.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{c.label}</h3>
                    {c.href ? (
                      <a href={c.href} className="text-sm text-primary hover:underline mt-0.5 block">
                        {c.value}
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-0.5">{c.value}</p>
                    )}
                  </div>
                </div>
              ))}

              <div className="rounded-xl overflow-hidden border border-border h-56">
                <iframe
                  title="SecureKey Locksmith Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d57384.30904582!2d29.2!3d-25.87!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1ebc3b5a42b0b0b7%3A0x4a2e9a52b8c46f0!2sWitbank%2C%20Mpumalanga!5e0!3m2!1sen!2sza!4v1"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                />
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              {submitted ? (
                <div className="h-full flex items-center justify-center p-10 bg-card rounded-xl border border-border text-center">
                  <div>
                    <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Send className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">Message Sent!</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      We'll get back to you within the hour. For urgent matters, please call us directly.
                    </p>
                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setFormData({ name: "", phone: "", email: "", service: "", message: "" });
                      }}
                      className="mt-4 text-sm text-primary hover:underline"
                    >
                      Send another message
                    </button>
                  </div>
                </div>
              ) : (
                <form className="p-6 bg-card rounded-xl border border-border space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      maxLength={100}
                      className={`w-full px-4 py-2.5 bg-input rounded-lg border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 ${errors.name ? "border-destructive" : "border-border"}`}
                      placeholder="Your name"
                    />
                    {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      maxLength={15}
                      className={`w-full px-4 py-2.5 bg-input rounded-lg border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 ${errors.phone ? "border-destructive" : "border-border"}`}
                      placeholder="e.g. 082 123 4567"
                    />
                    {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      maxLength={255}
                      className="w-full px-4 py-2.5 bg-input rounded-lg border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="your@email.co.za"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Service Needed *</label>
                    <select
                      name="service"
                      value={formData.service}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 bg-input rounded-lg border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 ${errors.service ? "border-destructive" : "border-border"}`}
                    >
                      <option value="">Select a service</option>
                      <option>Emergency Lockout</option>
                      <option>Key Cutting</option>
                      <option>Lock Change / Rekey</option>
                      <option>Car Key Programming</option>
                      <option>Commercial Security</option>
                      <option>Safe Services</option>
                      <option>Other</option>
                    </select>
                    {errors.service && <p className="text-xs text-destructive mt-1">{errors.service}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Message</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={4}
                      maxLength={1000}
                      className="w-full px-4 py-2.5 bg-input rounded-lg border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                      placeholder="Describe your situation..."
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="submit"
                      onClick={(e) => handleSubmit(e, "whatsapp")}
                      className="flex-1 inline-flex items-center justify-center gap-2 py-3 bg-[#25D366] text-white font-semibold rounded-lg hover:bg-[#20bd5a] transition-colors"
                    >
                      <MessageCircle className="h-5 w-5" />
                      Send via WhatsApp
                    </button>
                    <button
                      type="submit"
                      onClick={(e) => handleSubmit(e, "email")}
                      className="flex-1 inline-flex items-center justify-center gap-2 py-3 bg-gradient-gold text-primary-foreground font-semibold rounded-lg shadow-gold hover:scale-[1.02] transition-transform"
                    >
                      <Mail className="h-5 w-5" />
                      Send via Email
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
