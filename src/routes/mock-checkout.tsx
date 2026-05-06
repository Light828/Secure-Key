import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/mock-checkout")({
  component: MockCheckoutPage,
  head: () => ({ meta: [{ title: "Mock Checkout | SecureKey" }] }),
});

function MockCheckoutPage() {
  const search = new URLSearchParams(window.location.search);
  const amount = Number(search.get("amount") ?? 1000);
  const description = search.get("description") ?? "Mock payment";
  const success = search.get("success") ?? "/";
  const cancel = search.get("cancel") ?? "/";

  useEffect(() => {
    document.title = "Mock Checkout";
  }, []);

  const complete = () => {
    const url = new URL(success, window.location.href);
    url.searchParams.set("mock_session_id", "mock_" + Math.random().toString(36).slice(2, 9));
    url.searchParams.set("status", "paid");
    window.location.href = url.toString();
  };

  const cancelPayment = () => {
    window.location.href = cancel;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-xl w-full rounded-xl border border-border bg-card p-8 text-center">
        <h1 className="text-2xl font-bold text-foreground">Mock Checkout</h1>
        <p className="mt-4 text-muted-foreground">{description}</p>
        <p className="mt-2 text-lg font-semibold text-foreground">Amount: R{(amount/100).toFixed(2)}</p>
        <div className="mt-6 flex justify-center gap-4">
          <button onClick={complete} className="px-6 py-2 rounded-md bg-primary text-primary-foreground font-semibold">Complete Payment (mock)</button>
          <button onClick={cancelPayment} className="px-6 py-2 rounded-md border border-border">Cancel</button>
        </div>
      </div>
    </div>
  );
}
