import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { login, register, updateMyProfile, forgotPassword, resetPassword, verifyAccount } from "@/lib/shop-api";
import { useAuth } from "@/hooks/use-auth";
import { setSession } from "@/lib/auth-client";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [{ title: "Account | SecureKey Locksmith" }],
  }),
});

function AuthPage() {
  const { user, token, isAuthenticated, isAdmin } = useAuth();
  const [mode, setMode] = useState<"login" | "register" | "forgot" | "reset" | "verify">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [province, setProvince] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileAddressLine, setProfileAddressLine] = useState("");
  const [profileCity, setProfileCity] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    setProfileName(user.name || "");
    setProfileEmail(user.email || "");
    setProfilePhone(user.phone || "");
    setProfileAddressLine(user.addressLine || "");
    setProfileCity(user.city || "");
  }, [user]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      if (mode === "register") {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        if (!acceptTerms) {
          throw new Error("You must accept the terms and conditions");
        }
        if (password.length < 8) {
          throw new Error("Password must be at least 8 characters long");
        }
        const res = await register({ name, email, password, phone, addressLine, city });
        setMessage(res.message + " Check your email for the 6-digit verification code.");
        setMode("verify");
      } else if (mode === "forgot") {
        const res = await forgotPassword(email);
        setMessage(res.message);
        setMode("reset");
        setEmail("");
      } else if (mode === "reset") {
        const res = await resetPassword(resetCode, newPassword);
        setMessage(res.message);
        setResetCode("");
        setNewPassword("");
        setMode("login");
      } else if (mode === "verify") {
        const res = await verifyAccount(resetCode);
        setMessage(res.message || "Account verified. You may now login.");
        setResetCode("");
        setMode("login");
      } else {
        const res = await login({ email, password });
        setSession({ token: res.token, user: res.user });
        setMessage("Login successful.");
        navigate({ to: res.user.role === "admin" ? "/admin-shop" : "/shop" });
      }
    } catch (error) {
      setMessage((error as Error).message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const submitProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;

    setMessage("");
    setLoading(true);
    try {
      const response = await updateMyProfile(token, {
        name: profileName,
        phone: profilePhone,
        addressLine: profileAddressLine,
        city: profileCity,
      });
      setSession({ token, user: response.user });
      setMessage("Profile updated successfully.");
    } catch (error) {
      setMessage((error as Error).message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <section className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
            {isAuthenticated ? (
              <>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {isAdmin
                      ? "You are signed in as an admin. Use your dashboard to manage enquiries and customer orders."
                      : "Manage your account details, delivery address, and contact information."}
                  </p>
                </div>

                <div className="mb-6 grid gap-4 rounded-lg border border-border bg-gradient-to-br from-primary/10 to-primary/5 p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Account Type</p>
                      <p className="mt-1 text-lg font-semibold text-foreground">{isAdmin ? "Admin" : "Client"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Email Address</p>
                      <p className="mt-1 text-lg font-semibold text-foreground break-all">{profileEmail || "Not set"}</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={submitProfile} className="space-y-6">
                  <div className="rounded-lg border border-border bg-card p-4">
                    <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">Personal Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Full Name *</label>
                        <input
                          required
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          placeholder="Enter your full name"
                          className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Phone Number</label>
                        <input
                          value={profilePhone}
                          onChange={(e) => setProfilePhone(e.target.value)}
                          placeholder="e.g., 068 158 1116"
                          className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-card p-4">
                    <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">Delivery Address</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Street Address</label>
                        <input
                          value={profileAddressLine}
                          onChange={(e) => setProfileAddressLine(e.target.value)}
                          placeholder="e.g., 123 Main Street"
                          className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">City</label>
                          <input
                            value={profileCity}
                            onChange={(e) => setProfileCity(e.target.value)}
                            placeholder="e.g., Cape Town"
                            className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {message && (
                    <div className={`p-3 rounded-md text-sm ${message.includes("successfully") ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400" : "bg-destructive/10 border border-destructive/30 text-destructive"}`}>
                      {message}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-md bg-gradient-gold px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60 hover:shadow-lg transition-all"
                  >
                    {loading ? "Saving..." : "Save profile"}
                  </button>
                </form>
              </>
            ) : (
              <>
                {mode !== "forgot" && mode !== "reset" && (
                  <div className="mb-6 flex rounded-lg bg-muted p-1 text-sm">
                    <button
                      onClick={() => setMode("login")}
                      className={`flex-1 rounded-md py-2 ${mode === "login" ? "bg-background text-foreground" : "text-muted-foreground"}`}
                    >
                      Login
                    </button>
                    <button
                      onClick={() => setMode("register")}
                      className={`flex-1 rounded-md py-2 ${mode === "register" ? "bg-background text-foreground" : "text-muted-foreground"}`}
                    >
                      Create account
                    </button>
                  </div>
                )}

                <h1 className="text-2xl font-bold text-foreground">
                  {mode === "login"
                    ? "Welcome back"
                    : mode === "register"
                      ? "Create your account"
                      : mode === "forgot"
                        ? "Reset your password"
                        : "Enter your reset code"}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {mode === "login"
                    ? "Login to access your dashboard."
                    : mode === "register"
                      ? "After signup, verify your account by email before login."
                      : mode === "forgot"
                        ? "Enter your email to receive a 6-digit reset code."
                        : "Enter the code from your email and your new password."}
                </p>

                <form onSubmit={submit} className="mt-6 space-y-4">
                  {mode === "register" && (
                    <>
                      <input
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Full name"
                        className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm"
                      />
                      <input
                        required
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email address"
                        className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm"
                      />
                      <input
                        required
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm"
                      />
                      <input
                        required
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm"
                      />
                      <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Phone number"
                        type="tel"
                        className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm"
                      />
                      <input
                        value={addressLine}
                        onChange={(e) => setAddressLine(e.target.value)}
                        placeholder="Street address"
                        className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="City"
                          className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm"
                        />
                        <input
                          value={province}
                          onChange={(e) => setProvince(e.target.value)}
                          placeholder="Province"
                          className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm"
                        />
                      </div>
                      <input
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="Postal code"
                        className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm"
                      />
                      <div className="flex items-center space-x-2">
                        <input
                          required
                          type="checkbox"
                          id="terms"
                          checked={acceptTerms}
                          onChange={(e) => setAcceptTerms(e.target.checked)}
                          className="h-4 w-4 rounded border-border"
                        />
                        <label htmlFor="terms" className="text-xs text-muted-foreground">
                          I agree to the terms and conditions
                        </label>
                      </div>
                    </>
                  )}

                  {(mode === "login" || mode === "forgot") && (
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm"
                    />
                  )}

                  {mode === "verify" && (
                    <>
                      <input
                        required
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value)}
                        placeholder="6-digit verification code"
                        maxLength={6}
                        className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm"
                      />
                    </>
                  )}

                  {mode === "reset" && (
                    <>
                      <input
                        required
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value)}
                        placeholder="6-digit code from email"
                        maxLength={6}
                        className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm"
                      />
                      <input
                        required
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New password"
                        className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm"
                      />
                    </>
                  )}

                  {(mode === "login") && (
                    <input
                      required
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm"
                    />
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                  >
                    {loading
                      ? "Please wait..."
                      : mode === "login"
                        ? "Login"
                        : mode === "register"
                          ? "Create account"
                          : mode === "forgot"
                            ? "Send reset code"
                            : mode === "reset"
                              ? "Reset password"
                              : "Verify account"}
                  </button>
                </form>

                {mode === "login" && (
                  <button
                    onClick={() => setMode("forgot")}
                    className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-primary"
                  >
                    Forgot password?
                  </button>
                )}

                {(mode === "forgot" || mode === "reset") && (
                  <button
                    onClick={() => setMode("login")}
                    className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-primary"
                  >
                    Back to login
                  </button>
                )}
              </>
            )}

            {message && <p className="mt-4 text-sm text-primary">{message}</p>}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
