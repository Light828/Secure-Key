import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/use-auth";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Clock3, LayoutDashboard, LogOut, MapPin, Package2, ShieldCheck, ShoppingBag, Truck, UserCircle2 } from "lucide-react";
import logoIcon from "@/assets/logo-icon.png";
import {
  confirmStripePayment,
  createCheckoutSession,
  getCart,
  getMyOrders,
  removeCartItem,
  updateCartItem,
  type CartResponse,
  type Order,
} from "@/lib/shop-api";
import {
  formatOrderDate,
  formatPaymentStatus,
  formatProcessingStatus,
  getOrderLocation,
  getOrderTimeline,
  isOrderCancelled,
  type TimelineStep,
} from "@/lib/order-status";

import { Loader2, AlertCircle } from "lucide-react";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { calculateDeliveryFee, type DeliveryFeeRequest, type DeliveryFeeResponse } from "@/lib/shop-api";
import { toast } from "sonner";

import StripeTestCards from "@/components/StripeTestCards";

export const Route = createFileRoute("/cart")({
  component: CartPage,
  head: () => ({
    meta: [{ title: "Cart & Checkout | SecureKey Locksmith" }],
  }),
});

function CartPage() {
  const CHECKOUT_CONTEXT_KEY = "securekey-stripe-checkout-context";
  const { token, user, isAuthenticated, isAdmin, logout } = useAuth();
  const recentPaymentsRef = useRef<HTMLDivElement | null>(null);
  const [cart, setCart] = useState<CartResponse>({ items: [], total: 0 });
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [message, setMessage] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState<{ orderId: number; orderNumber?: string; paymentStatus: string; amount: number; currency: string; createdAt: string } | null>(null);
  const [clientSecret, setClientSecret] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRedirectingToStripe, setIsRedirectingToStripe] = useState(false);
  const [deliveryType, setDeliveryType] = useState<'collect' | 'deliver'>('collect');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [collectTime, setCollectTime] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryDistanceKm, setDeliveryDistanceKm] = useState(0);

  const calculateFee = async () => {
    if (!token) return;
    try {
      const result = await calculateDeliveryFee(token, {
        deliveryType,
        address: deliveryAddress,
        collectTime,
      });
      setDeliveryFee(result.deliveryFee);
      setDeliveryDistanceKm(result.distanceKm);
    } catch (error) {
      setMessage((error as Error).message || "Fee calculation failed");
    }
  };

  const closeOrderDetails = () => {
    setSelectedOrder(null);
    setShowAllHistory(false);
  };

  const normalizeOrder = (order: Order): Order => ({
    ...order,
    items: Array.isArray(order.items) ? order.items : [],
    location_history: Array.isArray(order.location_history) ? order.location_history : [],
  });

  const loadData = async (): Promise<Order[]> => {
    if (!token) return [];
    try {
      const [cartData, orderData] = await Promise.all([getCart(token), getMyOrders(token)]);
      setCart(cartData);
      const loadedOrders = (orderData.orders ?? []).map(normalizeOrder);
      setOrders(loadedOrders);
      console.log("Loaded orders:", loadedOrders);
      return loadedOrders;
    } catch (error) {
      console.error("Error loading data:", error);
      setMessage((error as Error).message || "Failed to load orders");
      return [];
    }
  };

  const loadOrders = async (): Promise<Order[]> => {
    if (!token) return [];
    try {
      const orderData = await getMyOrders(token);
      const loadedOrders = (orderData.orders ?? []).map(normalizeOrder);
      setOrders(loadedOrders);
      return loadedOrders;
    } catch (error) {
      console.error("Error loading orders:", error);
      return [];
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }

    loadData()
      .catch((error) => setMessage((error as Error).message || "Failed to load cart"))
      .finally(() => setLoading(false));
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (!token) return;

    const search = new URLSearchParams(window.location.search);
    const status = search.get("status");
    const sessionId = search.get("session_id");

    if (status !== "success" || !sessionId) return;

    const confirm = async () => {
      setMessage("Confirming Stripe payment...");
      try {
        const savedContext = (() => {
          try {
            return JSON.parse(window.sessionStorage.getItem(CHECKOUT_CONTEXT_KEY) || "null") as {
              deliveryType?: 'collect' | 'deliver';
              deliveryAddress?: string;
              deliveryDistanceKm?: number;
              deliveryFee?: number;
              checkoutTotal?: number;
            } | null;
          } catch {
            return null;
          }
        })();

        const result = await confirmStripePayment(
          token,
          sessionId,
          savedContext?.deliveryType ?? deliveryType,
          savedContext?.deliveryAddress ?? deliveryAddress,
          savedContext?.deliveryDistanceKm ?? deliveryDistanceKm,
          savedContext?.deliveryFee ?? deliveryFee
        );

        setCart({ items: [], total: 0 });
        toast.success(`Order ${result.orderId} confirmed and cart cleared.`);

        // Wait for the order to appear in the database-backed history.
        let attempts = 0;
        let ordersLoaded = false;
        let loadedOrders: Order[] = [];

        while (attempts < 5 && !ordersLoaded) {
          loadedOrders = await loadOrders();
          // Check if the new order is in the array
          if (loadedOrders.some(order => order.id === result.orderId)) {
            ordersLoaded = true;
            console.log("✓ New order found in loaded orders");
          }
          attempts++;
          if (!ordersLoaded && attempts < 5) {
            console.log(`Retry ${attempts}/5 - waiting for order...`);
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms before retry
          }
        }

        if (!ordersLoaded) {
          console.warn("Order not found after 5 retries, but payment was successful");
        }

        const matchingOrder = loadedOrders.find(o => o.id === result.orderId);
        const finalTotal = matchingOrder?.total ?? savedContext?.checkoutTotal ?? (cart.total + deliveryFee);
        setPaymentSuccess({
          orderId: result.orderId,
          orderNumber: matchingOrder?.orderNumber,
          paymentStatus: result.paymentStatus,
          amount: finalTotal,
          currency: "ZAR",
          createdAt: new Date().toISOString()
        });
        setMessage("✓ Payment confirmed! Your order has been saved and moved to payment history.");
        window.sessionStorage.removeItem(CHECKOUT_CONTEXT_KEY);
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete("status");
        cleanUrl.searchParams.delete("session_id");
        window.history.replaceState({}, "", cleanUrl.toString());
      } catch (error) {
        setMessage((error as Error).message || "Failed to confirm Stripe payment");
        toast.error((error as Error).message || "Failed to confirm Stripe payment");
      }
    };

    confirm();
  }, [token]);

  useEffect(() => {
    if (!paymentSuccess) return;

    const successSection = document.getElementById("payment-success");
    if (successSection) {
      successSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    const historySection = recentPaymentsRef.current;
    if (historySection) {
      historySection.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    // Auto-open the order details sheet after a short delay
    const timer = setTimeout(() => {
      const matchingOrder = orders.find(o => o.id === paymentSuccess.orderId);
      if (matchingOrder) {
        setSelectedOrder(normalizeOrder(matchingOrder));
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [paymentSuccess, orders]);

  const handleQuantity = async (itemId: number, quantity: number) => {
    if (!token) return;
    setMessage("");
    try {
      const next = await updateCartItem(token, itemId, quantity);
      setCart(next);
    } catch (error) {
      setMessage((error as Error).message || "Failed to update quantity");
    }
  };

  const handleDelete = async (itemId: number) => {
    if (!token) return;
    setMessage("");
    try {
      const next = await removeCartItem(token, itemId);
      setCart(next);
    } catch (error) {
      setMessage((error as Error).message || "Failed to remove item");
    }
  };

  const handleStripePay = async () => {
    if (!token) return;
    if (cart.items.length === 0) {
      setMessage("Your cart is empty.");
      return;
    }
    if (deliveryType === 'deliver' && !deliveryAddress.trim()) {
      setMessage("Enter delivery address.");
      return;
    }
    // Collect time optional - admin will call
    // if (deliveryType === 'collect' && !collectTime) {
    //   setMessage("Enter collect time.");
    //   return;
    // }

    setMessage("");
    setIsRedirectingToStripe(true);

    try {
      window.sessionStorage.setItem(
        CHECKOUT_CONTEXT_KEY,
        JSON.stringify({
          deliveryType,
          deliveryAddress,
          deliveryDistanceKm,
          deliveryFee,
          checkoutTotal: cart.total + deliveryFee,
        })
      );

      const finalTotal = cart.total + deliveryFee;
      const amountCents = Math.round(finalTotal * 100);
      const response = await createCheckoutSession(token ?? null, {
        amountCents,
        description: `SecureKey Locksmith order (${deliveryType}) ${user?.name || "client"}`,
        successUrl: `${window.location.origin}/cart?status=success#my-orders`,
        cancelUrl: `${window.location.origin}/cart?status=cancel`,
      });

      if (!response.url) {
        throw new Error("Stripe checkout URL missing");
      }

      // Refresh orders so the pending order appears in history immediately
      try {
        await loadOrders();
      } catch (e) {
        console.warn("Failed to refresh orders before redirect:", e);
      }

      setCart({ items: [], total: 0 });
      toast.success("Cart cleared. Stripe checkout is opening.");

      window.location.href = response.url;
    } catch (error) {
      setMessage((error as Error).message || "Payment failed");
      setIsRedirectingToStripe(false);
      toast.error((error as Error).message || "Payment failed");
    }
  };

  const totalCartItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const formatRands = (amount: number) => `R${amount.toFixed(2)}`;
  const clientMenu = [
    { to: "/cart", label: "Client Dashboard", icon: LayoutDashboard },
    { to: "/shop", label: "Shop", icon: ShoppingBag },
    { to: "/auth", label: "Profile", icon: UserCircle2 },
  ] as const;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <main className="pt-16 pb-16">
          <section className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <h1 className="text-2xl font-bold text-foreground">Login required</h1>
              <p className="mt-2 text-sm text-muted-foreground">Please login before you can use cart and checkout.</p>
              <Link to="/auth" className="mt-5 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                Login / Create account
              </Link>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <main className="pt-16 pb-16">
          <section className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <h1 className="text-2xl font-bold text-foreground">Admin account detected</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Admin and client dashboards are separate. Use admin tools to manage products and orders.
              </p>
              <Link to="/admin-shop" className="mt-5 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                Go to admin dashboard
              </Link>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  const stepClass = (state: TimelineStep["state"]) => {
    if (state === "done") return "border-primary/70 bg-primary/20 text-primary";
    if (state === "current") return "border-emerald-500/60 bg-emerald-500/15 text-emerald-400";
    return "border-border bg-muted/20 text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 flex-col border-r border-border bg-card/90 p-6 lg:flex">
          <Link to="/" className="flex items-center gap-3">
            <img src={logoIcon} alt="SecureKey Locksmith" width={34} height={34} />
            <span className="font-heading text-base tracking-widest text-gradient-gold">SECUREKEY</span>
          </Link>
          <p className="mt-6 text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Client Workspace</p>
          <nav className="mt-4 space-y-2">
            {clientMenu.map((item) => {
              const Icon = item.icon;
              const isCurrent = item.to === "/cart";
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/10 ${isCurrent
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground"
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div ref={recentPaymentsRef} className="mt-8 rounded-lg border border-border/50 bg-muted/20 p-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-3">Recent Payments</p>
            {orders.length === 0 && !paymentSuccess ? (
              <p className="text-xs text-muted-foreground">No orders yet</p>
            ) : (
              <div className="space-y-2">
                {paymentSuccess && !orders.find(o => o.id === paymentSuccess.orderId) && (
                  <div className="w-full text-left p-2 rounded-md bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                        #{paymentSuccess.orderId} ({paymentSuccess.orderNumber || 'ORD-?'})
                        <span className="text-[10px] text-emerald-400">✓ NEW</span>
                      </span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                        paid
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-primary font-semibold">R{paymentSuccess.amount.toFixed(2)}</span>
                      <span className="text-[10px] text-muted-foreground">{formatOrderDate(paymentSuccess.createdAt)}</span>
                    </div>
                    <div className="mt-1 text-[10px] text-muted-foreground">
                      processing
                    </div>
                  </div>
                )}
                {orders.slice(0, 4).map((order) => {
                  const isLatestPayment = paymentSuccess?.orderId === order.id;
                  const itemSummary = order.items.length > 0
                    ? order.items.map((item) => `${item.quantity}x ${item.productName}`).join(" · ")
                    : "";
                  return (
                    <button
                      key={order.id}
                      onClick={() => setSelectedOrder(normalizeOrder(order))}
                      className={`w-full text-left p-2 rounded-md transition-colors ${isLatestPayment
                        ? 'bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/20'
                        : 'bg-muted/30 hover:bg-muted/50'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                          {order.orderNumber || `#${order.id}`}
                          {isLatestPayment && <span className="text-[10px] text-emerald-400">✓ NEW</span>}
                        </span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${order.payment_status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                          {order.payment_status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-primary font-semibold">R{order.total.toFixed(2)}</span>
                        <span className="text-[10px] text-muted-foreground">{formatOrderDate(order.created_at)}</span>
                      </div>
                      {itemSummary && (
                        <div className="mt-1 text-[10px] text-muted-foreground line-clamp-2">
                          {itemSummary}
                        </div>
                      )}
                      <div className="mt-1 text-[10px] text-muted-foreground">
                        {formatProcessingStatus(order.processing_status)}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-auto rounded-xl border border-border bg-background/60 p-4 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">{user?.name || "Client"}</p>
            <p className="mt-1 truncate">{user?.email || "No email"}</p>
            <button
              onClick={logout}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/10"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </aside>

        <div className="flex-1">
          <header className="sticky top-0 z-30 border-b border-border bg-background/85 px-4 py-3 backdrop-blur lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Dashboard</p>
                <h1 className="text-lg font-semibold text-foreground">Client Control Panel</h1>
              </div>
              <button
                onClick={logout}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/10 lg:hidden"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>

          </header>

          <main className="pb-16 pt-6">
            <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="rounded-2xl border border-border bg-card/90 p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Client dashboard</p>
                    <h1 className="mt-2 text-3xl font-bold text-foreground">Your Cart</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {user?.name || "Client"} · {user?.email || "No email"}
                      {user?.phone ? ` · ${user.phone}` : ""}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center md:min-w-[320px]">
                    <div className="rounded-xl border border-border bg-background/50 p-3">
                      <p className="text-xs text-muted-foreground">Items</p>
                      <p className="mt-1 text-xl font-semibold text-foreground">{totalCartItems}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-background/50 p-3">
                      <p className="text-xs text-muted-foreground">Cart total</p>
                      <p className="mt-1 text-xl font-semibold text-foreground">{formatRands(cart.total)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">

              <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold text-foreground">Your cart</h2>
                {message && <p className="mt-3 text-sm text-primary">{message}</p>}

                {loading ? (
                  <div className="mt-6 rounded-xl border border-border bg-card p-6 text-muted-foreground">Loading cart...</div>
                ) : cart.items.length === 0 ? (
                  <div className="mt-6 rounded-xl border border-border bg-card p-8 text-center">
                    <p className="text-muted-foreground">Your cart is empty.</p>
                    <Link to="/shop" className="mt-4 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                      Go to store
                    </Link>
                  </div>
                ) : (
                  <div className="mt-6 space-y-4">
                    {cart.items.map((item) => (
                      <article key={item.id} className="rounded-xl border border-border bg-card p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h2 className="font-semibold text-foreground">{item.name}</h2>
                            <p className="mt-1 text-sm text-muted-foreground">{formatRands(Number(item.price))} each</p>
                          </div>
                          <button onClick={() => handleDelete(item.id)} className="text-sm text-destructive hover:underline">
                            Remove
                          </button>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <input
                            type="number"
                            min={1}
                            max={item.stock}
                            value={item.quantity}
                            onChange={(e) => handleQuantity(item.id, Number(e.target.value))}
                            className="w-20 rounded-md border border-border bg-input px-2 py-1 text-sm"
                          />
                          <span className="font-semibold text-primary">{formatRands(Number(item.subtotal))}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>

              <aside className="rounded-xl border border-border bg-card p-6">
                <h2 className="text-lg font-bold uppercase tracking-widest text-foreground">Checkout</h2>
                <p className="mt-3 text-xs text-muted-foreground leading-relaxed">Pay securely with Stripe. You will enter your card details on Stripe's hosted checkout page after confirming your order below.</p>

                {/* Delivery Options */}
                <div className="mt-6 border-t border-border pt-5">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">Delivery Option</h3>
                  <RadioGroup value={deliveryType} onValueChange={(val) => {
                    setDeliveryType(val as 'collect' | 'deliver');
                    setDeliveryFee(0);
                  }}>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 rounded-lg border border-border p-3 hover:bg-muted/30 cursor-pointer">
                        <RadioGroupItem value="collect" id="collect" />
                        <Label htmlFor="collect" className="flex-1 cursor-pointer text-sm font-medium">
                          <Truck className="mr-2 inline h-4 w-4" />
                          Collect from store (Free)
                        </Label>
                      </div>
                      <div className="flex items-center gap-2 rounded-lg border border-border p-3 hover:bg-muted/30 cursor-pointer">
                        <RadioGroupItem value="deliver" id="deliver" />
                        <Label htmlFor="deliver" className="flex-1 cursor-pointer text-sm font-medium">
                          <Package2 className="mr-2 inline h-4 w-4" />
                          Home delivery (R4/km)
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>

                  {/* Delivery Address Form */}
                  {deliveryType === 'deliver' && (
                    <div className="mt-4 space-y-3 border-t border-border pt-4">
                      <div>
                        <Label htmlFor="street" className="text-xs font-semibold uppercase text-muted-foreground">
                          Street Address *
                        </Label>
                        <Input
                          id="street"
                          placeholder="e.g., 123 Main Street"
                          value={deliveryAddress.split(',')[0] || ''}
                          onChange={(e) => {
                            const parts = deliveryAddress.split(',');
                            setDeliveryAddress(`${e.target.value},${parts[1] || ''},${parts[2] || ''},${parts[3] || ''}`);
                          }}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="city" className="text-xs font-semibold uppercase text-muted-foreground">
                          City *
                        </Label>
                        <Input
                          id="city"
                          placeholder="e.g., Johannesburg"
                          value={deliveryAddress.split(',')[1] || ''}
                          onChange={(e) => {
                            const parts = deliveryAddress.split(',');
                            setDeliveryAddress(`${parts[0] || ''},${e.target.value},${parts[2] || ''},${parts[3] || ''}`);
                          }}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="province" className="text-xs font-semibold uppercase text-muted-foreground">
                          Province *
                        </Label>
                        <Input
                          id="province"
                          placeholder="e.g., Gauteng"
                          value={deliveryAddress.split(',')[2] || ''}
                          onChange={(e) => {
                            const parts = deliveryAddress.split(',');
                            setDeliveryAddress(`${parts[0] || ''},${parts[1] || ''},${e.target.value},${parts[3] || ''}`);
                          }}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="postal" className="text-xs font-semibold uppercase text-muted-foreground">
                          Postal Code *
                        </Label>
                        <Input
                          id="postal"
                          placeholder="e.g., 2000"
                          value={deliveryAddress.split(',')[3] || ''}
                          onChange={(e) => {
                            const parts = deliveryAddress.split(',');
                            setDeliveryAddress(`${parts[0] || ''},${parts[1] || ''},${parts[2] || ''},${e.target.value}`);
                          }}
                          className="mt-1"
                        />
                      </div>
                      <Button
                        onClick={calculateFee}
                        disabled={!deliveryAddress.split(',').slice(0, 4).every(p => p.trim())}
                        className="w-full mt-2"
                        variant="outline"
                        size="sm"
                      >
                        Calculate Delivery Fee
                      </Button>
                      {deliveryFee > 0 && (
                        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">
                          Delivery fee: <span className="font-bold">{formatRands(deliveryFee)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-6 border-t border-border pt-5">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-foreground mb-3">Order Total</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-semibold">{formatRands(cart.total)}</span>
                    </div>
                    {deliveryFee > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Delivery</span>
                        <span className="font-semibold text-primary">{formatRands(deliveryFee)}</span>
                      </div>
                    )}
                    <div className="border-t border-border pt-3 flex items-center justify-between">
                      <span className="font-bold">Total</span>
                      <span className="text-lg font-bold text-primary">{formatRands(cart.total + deliveryFee)}</span>
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
                    You are charged exactly the final total shown above when payment is approved.
                  </p>
                </div>
                {paymentSuccess ? (
                  <div id="payment-success" className="mt-5 rounded-xl border border-emerald-500/50 bg-gradient-to-br from-emerald-500/15 to-emerald-600/10 p-6 shadow-lg">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <svg className="h-6 w-6 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold uppercase tracking-widest text-emerald-300">✓ Payment Successful</p>
                        <h3 className="mt-1 text-xl font-bold text-foreground">Order #{paymentSuccess.orderId} Confirmed</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Your payment has been processed successfully via Stripe. Your order is now in our system and the admin will begin preparing it.
                        </p>
                        <div className="mt-3 space-y-2 rounded-lg border border-emerald-500/20 bg-card p-3 text-xs text-foreground">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Order Status:</span>
                            <span className="font-semibold text-emerald-400">{paymentSuccess.paymentStatus}</span>
                          </div>
                        </div>
                        <p className="mt-3 text-xs text-muted-foreground">
                          ✓ Your payment has been confirmed and your order is now being prepared.
                        </p>
                      </div>
                    </div>
                    <div className="mt-6 rounded-lg border border-border bg-card p-4">
                      <h4 className="text-sm font-semibold text-foreground mb-3">Order Summary</h4>
                      {(() => {
                        const matchingOrder = orders.find(o => o.id === paymentSuccess.orderId);
                        if (matchingOrder) {
                          return (
                            <>
                              <div className="space-y-2 text-sm mb-4">
                                <div className="flex justify-between text-muted-foreground">
                                  <span>Order ID:</span>
                                  <span className="font-semibold text-foreground">#{matchingOrder.id}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                  <span>Amount Paid:</span>
                                  <span className="font-semibold text-primary">R{matchingOrder.total.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                  <span>Payment Status:</span>
                                  <span className="font-semibold text-emerald-400">{formatPaymentStatus(matchingOrder.payment_status)}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                  <span>Processing:</span>
                                  <span className="font-semibold text-foreground">{formatProcessingStatus(matchingOrder.processing_status)}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground pt-2 border-t border-border/50">
                                  <span>Order Date:</span>
                                  <span className="font-semibold text-foreground text-xs">{formatOrderDate(matchingOrder.created_at)}</span>
                                </div>
                              </div>
                              <div className="mt-4 pt-4 border-t border-border/50">
                                <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Tracking Timeline</h5>
                                <div className="flex flex-wrap gap-2">
                                  {getOrderTimeline(matchingOrder.payment_status, matchingOrder.processing_status).map((step) => (
                                    <span key={step.key} className={`rounded-full border px-2 py-1 text-xs font-semibold ${step.state === 'done' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : step.state === 'current' ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-muted/50 border-border text-muted-foreground'}`}>
                                      {step.label}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </>
                          );
                        }
                        return (
                          <div className="p-4 bg-muted/20 rounded text-sm text-muted-foreground space-y-2">
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Order ID:</span>
                                <span className="font-semibold text-foreground">#{paymentSuccess.orderId}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Amount Paid:</span>
                                <span className="font-semibold text-primary">R{paymentSuccess.amount.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Payment Status:</span>
                                <span className="font-semibold text-emerald-400">✓ Paid</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Date:</span>
                                <span className="font-semibold text-foreground text-xs">{formatOrderDate(paymentSuccess.createdAt)}</span>
                              </div>
                            </div>
                            <div className="pt-2 border-t border-border/50 text-xs">
                              🔄 Syncing order details from server...
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={async () => {
                          setMessage("Refreshing order...");
                          await loadData();
                          setMessage("");
                        }}
                        className="flex-1 rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors"
                      >
                        🔄 Refresh Order
                      </button>
                      <button
                        onClick={() => {
                          const matchingOrder = orders.find(o => o.id === paymentSuccess.orderId);
                          if (matchingOrder) {
                            setSelectedOrder(normalizeOrder(matchingOrder));
                          }
                        }}
                        className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        View Full Details
                      </button>
                      <button
                        onClick={() => {
                          setPaymentSuccess(null);
                          setDeliveryType('collect');
                          setDeliveryAddress('');
                          setDeliveryFee(0);
                          setDeliveryDistanceKm(0);
                        }}
                        className="flex-1 rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors"
                      >
                        Continue Shopping
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={handleStripePay}
                      disabled={cart.items.length === 0}
                      className="mt-6 w-full rounded-lg bg-gradient-gold px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50 hover:opacity-90 transition-opacity"
                    >
                      {isRedirectingToStripe ? "Opening Stripe checkout..." : "Pay with Stripe card"}
                    </button>
                    <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
                      Stripe checkout will open in a secure window. You'll return here after payment is complete.
                    </p>
                    <div className="mt-5 border-t border-border pt-5">
                      <StripeTestCards onFill={(card) => {
                        navigator.clipboard.writeText(card.number);
                        alert(`Copied ${card.name}: ${card.number}\nPaste on Stripe page\nExpiry: 12/34, CVC: 123`);
                      }} />
                    </div>
                  </>
                )}
              </aside>
            </section>
          </main>
        </div>
      </div>
      <Sheet open={Boolean(selectedOrder)} onOpenChange={(open) => {
        if (!open) {
          closeOrderDetails();
        }
      }}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          {selectedOrder && (
            <div className="space-y-6">
              <SheetHeader>
                <SheetTitle>Order #{selectedOrder.id}</SheetTitle>
                <SheetDescription>
                  Full tracking details, current charge, and location history.
                </SheetDescription>
              </SheetHeader>

              <div className="rounded-xl border border-border bg-card p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <Info label="Charged" value={formatRands(Number(selectedOrder.total))} />
                  <Info label="Payment" value={formatPaymentStatus(selectedOrder.payment_status)} />
                  <Info label="Processing" value={formatProcessingStatus(selectedOrder.processing_status)} />
                  <Info label="Current location" value={getOrderLocation(selectedOrder.processing_status, selectedOrder.payment_status, selectedOrder.location_note)} />
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Items ordered</h3>
                <div className="mt-3 space-y-3">
                  {selectedOrder.items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No line items available.</p>
                  ) : (
                    selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-4 rounded-lg border border-border/70 bg-muted/10 px-3 py-2 text-sm">
                        <div>
                          <p className="font-semibold text-foreground">{item.productName}</p>
                          <p className="text-xs text-muted-foreground">Qty {item.quantity} · R{Number(item.unitPrice).toFixed(2)} each</p>
                        </div>
                        <p className="font-semibold text-primary">R{Number(item.subtotal).toFixed(2)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Tracking timeline</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {getOrderTimeline(selectedOrder.payment_status, selectedOrder.processing_status).map((step) => (
                    <span key={step.key} className={`rounded-full border px-3 py-1 text-xs font-semibold ${stepClass(step.state)}`}>
                      {step.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Location history</h3>
                <div className="mt-4">
                  {selectedOrder.location_history.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No location updates yet.</p>
                  ) : (
                    <div className="relative pl-5">
                      <div className="absolute left-4 top-1 bottom-2 w-px bg-border/80" />
                      <div className="space-y-4">
                        {selectedOrder.location_history
                          .slice(0, showAllHistory ? selectedOrder.location_history.length : 3)
                          .map((entry, index) => {
                            const HistoryIcon = getHistoryIcon(entry.processing_status);
                            const isLatest = index === 0;

                            return (
                              <div key={`drawer-history-${index}`} className="relative flex gap-4">
                                <div className={`relative z-10 mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${getHistoryBadgeClass(entry.processing_status)}`}>
                                  <HistoryIcon className="h-4 w-4" />
                                </div>
                                <div className="flex-1 rounded-xl border border-border/70 bg-muted/10 p-3 text-sm">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="font-semibold text-foreground">{entry.location_note || formatProcessingStatus(entry.processing_status)}</p>
                                      <p className="mt-1 text-xs text-muted-foreground">Updated by {entry.admin_name}</p>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{formatOrderDate(entry.created_at)}</span>
                                  </div>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                                      {formatProcessingStatus(entry.processing_status)}
                                    </span>
                                    {isLatest && (
                                      <span className="animate-pulse rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                                        Latest update
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                      {selectedOrder.location_history.length > 3 && (
                        <button
                          type="button"
                          onClick={() => setShowAllHistory((value) => !value)}
                          className="mt-4 inline-flex rounded-md border border-primary/40 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10"
                        >
                          {showAllHistory ? "Show less" : `Show ${selectedOrder.location_history.length - 3} more`}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
      <Footer />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium text-foreground">{value}</p>
    </div>
  );
}

function getHistoryIcon(processingStatus: string) {
  switch (processingStatus) {
    case "completed":
      return ShieldCheck;
    case "processing":
      return Truck;
    case "new":
      return Package2;
    case "awaiting_payment":
      return Clock3;
    default:
      return MapPin;
  }
}

function getHistoryBadgeClass(processingStatus: string) {
  switch (processingStatus) {
    case "completed":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-400";
    case "processing":
      return "border-primary/40 bg-primary/10 text-primary";
    case "new":
      return "border-amber-500/40 bg-amber-500/10 text-amber-400";
    case "awaiting_payment":
      return "border-muted-foreground/30 bg-muted/20 text-muted-foreground";
    default:
      return "border-border bg-muted/20 text-muted-foreground";
  }
}
