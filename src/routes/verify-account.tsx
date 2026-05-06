import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { verifyAccount } from "@/lib/shop-api";

export const Route = createFileRoute("/verify-account")({
  component: VerifyAccountPage,
});

function VerifyAccountPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your account...");

  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing.");
      return;
    }

    verifyAccount(token)
      .then((res) => {
        setStatus("success");
        setMessage(res.message);
      })
      .catch((error) => {
        setStatus("error");
        setMessage((error as Error).message || "Failed to verify account");
      });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <section className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <h1 className="text-2xl font-bold text-foreground">Account verification</h1>
            <p className={`mt-3 text-sm ${status === "error" ? "text-destructive" : "text-primary"}`}>{message}</p>
            <Link to="/auth" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              Go to login
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
