import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, Phone } from "lucide-react";
import logoIcon from "@/assets/logo-icon.png";
import { useAuth } from "@/hooks/use-auth";

export default function Navbar() {
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.sessionStorage.getItem("securekey-navbar-open") === "true";
  });
  const location = useLocation();
  const { isAuthenticated, isAdmin, logout } = useAuth();

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem("securekey-navbar-open", String(open));
  }, [open]);

  const guestLinks = [
    { to: "/", label: "Home" },
    { to: "/shop", label: "Shop" },
    { to: "/services", label: "Services" },
    { to: "/pricing", label: "Pricing" },
    { to: "/gallery", label: "Gallery" },
    { to: "/about", label: "About" },
    { to: "/faq", label: "FAQ" },
    { to: "/contact", label: "Contact" },
  ] as const;

  const clientLinks = [
    { to: "/shop", label: "Shop" },
    { to: "/cart", label: "Cart" },
    { to: "/cart", label: "Client Dashboard" },
    { to: "/auth", label: "Profile" },
  ] as const;

  const adminLinks = [
    { to: "/admin-shop", label: "Admin Dashboard" },
    { to: "/admin", label: "Enquiries" },
    { to: "/shop", label: "Store" },
    { to: "/auth", label: "Profile" },
  ] as const;

  const links = isAuthenticated ? (isAdmin ? adminLinks : clientLinks) : guestLinks;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoIcon} alt="SecureKey Locksmith" width={36} height={36} />
            <span className="font-heading text-lg tracking-widest text-gradient-gold">
              SECUREKEY
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {links.map((link, index) => (
              <Link
                key={`${link.to}-${link.label}-${index}`}
                to={link.to}
                className={`text-sm tracking-wide transition-colors hover:text-primary ${
                  location.pathname === link.to
                    ? "text-primary font-semibold"
                    : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (

              <button
                onClick={logout}
                className="rounded-md border border-border px-3 py-1.5 text-xs text-foreground hover:border-primary/40"
              >
                Logout
              </button>
            ) : (
              <Link
                to="/auth"
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
              >
                Account
              </Link>
            )}
          </div>

          <button
            onClick={() => setOpen(!open)}
            className="md:hidden text-foreground"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-lg">
          <div className="px-4 py-4 space-y-3">
            {links.map((link, index) => (
              <Link
                key={`${link.to}-${link.label}-${index}`}
                to={link.to}
                onClick={() => {
                  if (link.to !== "/shop") setOpen(false);
                }}
                className={`block text-sm tracking-wide py-2 ${
                  location.pathname === link.to
                    ? "text-primary font-semibold"
                    : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex items-center gap-2 pt-2 border-t border-border">
            </div>
            <div className="pt-2">

              {isAuthenticated ? (
                <button
                  onClick={() => {
                    logout();
                    setOpen(false);
                  }}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm text-foreground"
                >
                  Logout
                </button>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setOpen(false)}
                  className="block rounded-md bg-primary px-3 py-2 text-center text-sm font-semibold text-primary-foreground"
                >
                  Account
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
