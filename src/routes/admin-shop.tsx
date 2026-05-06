import { createFileRoute, Link } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/use-auth";
import { ClipboardList, LayoutDashboard, LogOut, ShoppingBag, UserCircle2 } from "lucide-react";
import logoIcon from "@/assets/logo-icon.png";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  createAdminProduct,
  getAdminOrders,
  getAdminProducts,
  updateAdminOrderStatus,
  updateAdminProduct,
  uploadAdminImage,
  cancelAdminOrder,
  type Product,
  deleteAdminProduct,
} from "@/lib/shop-api";
import { formatOrderDate, formatPaymentStatus, formatProcessingStatus, getChargeText, getOrderLocation } from "@/lib/order-status";
import { toast } from "sonner";

export const Route = createFileRoute("/admin-shop")({
  component: AdminShopPage,
  head: () => ({
    meta: [{ title: "Admin Shop | SecureKey Locksmith" }],
  }),
});

type AdminOrder = Awaited<ReturnType<typeof getAdminOrders>>["orders"][number];

function AdminShopPage() {
  const { token, user, isAdmin, isAuthenticated, logout } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [locationNotes, setLocationNotes] = useState<Record<number, string>>({});
  const [message, setMessage] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [stock, setStock] = useState("0");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const adminMenu = [
    { to: "/admin-shop", label: "Shop Dashboard", icon: LayoutDashboard },
    { to: "/admin", label: "Enquiries", icon: ClipboardList },
    { to: "/shop", label: "Store View", icon: ShoppingBag },
    { to: "/auth", label: "Profile", icon: UserCircle2 },
  ] as const;

  const loadData = async () => {
    if (!token) return;
    const [p, o] = await Promise.all([getAdminProducts(token), getAdminOrders(token)]);
    setProducts(p.products);
    setOrders(o.orders);
    setLocationNotes((previous) => {
      const next: Record<number, string> = {};
      for (const order of o.orders) {
        next[order.id] = previous[order.id] ?? order.location_note ?? "";
      }
      return next;
    });
  };

  const normalizeOrder = (order: AdminOrder): AdminOrder => ({
    ...order,
    items: Array.isArray(order.items) ? order.items : [],
    location_history: Array.isArray(order.location_history) ? order.location_history : [],
  });

  useEffect(() => {
    if (!token || !isAdmin) return;
    loadData().catch((error) => setMessage((error as Error).message || "Failed to load admin data"));
  }, [token, isAdmin]);

  const createProduct = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;

    try {
      if (editId) {
        await updateAdminProduct(token, editId, {
          name,
          description,
          price: Number(price),
          stock: Number(stock),
          imageUrl,
          isActive: true,
        });
        setMessage("Product updated.");
      } else {
        await createAdminProduct(token, {
          name,
          description,
          price: Number(price),
          stock: Number(stock),
          imageUrl,
          isActive: true,
        });
        setMessage("Product created.");
      }
      setName("");
      setDescription("");
      setPrice("0");
      setStock("0");
      setImageUrl("");
      setEditId(null);
      setMessage("Product created.");
      await loadData();
    } catch (error) {
      setMessage((error as Error).message || "Failed to create product");
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditId(product.id);
    setName(product.name);
    setDescription(product.description ?? "");
    setPrice(String(product.price ?? 0));
    setStock(String(product.stock ?? 0));
    setImageUrl(product.image_url ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteProduct = async (id: number) => {
    if (!token) return;
    if (!confirm('Delete this product? This cannot be undone.')) return;
    try {
      await deleteAdminProduct(token, id);
      setMessage('Product deleted.');
      toast.success('Product deleted.');
      await loadData();
    } catch (err) {
      setMessage((err as Error).message || 'Failed to delete product');
      toast.error((err as Error).message || 'Failed to delete product');
    }
  };

  const toggleProduct = async (product: Product) => {
    if (!token) return;
    try {
      await updateAdminProduct(token, product.id, {
        name: product.name,
        description: product.description || "",
        price: Number(product.price),
        stock: Number(product.stock),
        imageUrl: product.image_url || "",
        isActive: !Boolean(product.is_active),
      });
      toast.success(`${product.name} updated.`);
      await loadData();
    } catch (error) {
      setMessage((error as Error).message || "Failed to update product");
      toast.error((error as Error).message || "Failed to update product");
    }
  };

  const updateOrderStatus = async (orderId: number, nextStatus: string) => {
    if (!token) return;
    try {
      await updateAdminOrderStatus(token, orderId, nextStatus, locationNotes[orderId] ?? "");
      await loadData();
      setMessage(`Order #${orderId} updated.`);
      toast.success(`Order #${orderId} updated.`);
    } catch (error) {
      setMessage((error as Error).message || "Failed to update order status");
      toast.error((error as Error).message || "Failed to update order status");
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!token) return;
    const reason = prompt("Enter cancellation reason (optional):");
    if (reason === null) return; // User cancelled the prompt

    try {
      await cancelAdminOrder(token, orderId, reason || "Cancelled by admin");
      await loadData();
      setMessage(`Order #${orderId} cancelled and stock restored.`);
      toast.success(`Order #${orderId} cancelled and stock restored.`);
    } catch (error) {
      setMessage((error as Error).message || "Failed to cancel order");
      toast.error((error as Error).message || "Failed to cancel order");
    }
  };

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <main className="pt-16 pb-16">
          <section className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <h1 className="text-2xl font-bold text-foreground">Admin access required</h1>
              <p className="mt-2 text-sm text-muted-foreground">Login with an admin account to manage stock and orders.</p>
              <Link to="/auth" className="mt-5 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                Go to login
              </Link>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  const activeOrder = selectedOrder ? normalizeOrder(selectedOrder) : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 flex-col border-r border-border bg-card/90 p-6 lg:flex">
          <Link to="/" className="flex items-center gap-3">
            <img src={logoIcon} alt="SecureKey Locksmith" width={34} height={34} />
            <span className="font-heading text-base tracking-widest text-gradient-gold">SECUREKEY</span>
          </Link>
          <p className="mt-6 text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Admin Workspace</p>
          <nav className="mt-4 space-y-2">
            {adminMenu.map((item) => {
              const Icon = item.icon;
              const isCurrent = item.to === "/admin-shop";
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  target={item.to === "/shop" ? "_blank" : undefined}
                  rel={item.to === "/shop" ? "noopener noreferrer" : undefined}
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

          <div className="mt-auto rounded-xl border border-border bg-background/60 p-4 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">{user?.name || "Admin"}</p>
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
                <h1 className="text-lg font-semibold text-foreground">Admin Control Panel</h1>
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
              <div className="mb-5 rounded-xl border border-border bg-card p-4 text-sm">
                <p className="font-semibold text-foreground">Admin dashboard</p>
                <p className="mt-1 text-muted-foreground">
                  {user?.name || "Admin"} · {user?.email || "No email"}
                  {user?.phone ? ` · ${user.phone}` : ""}
                </p>
                <Link to="/admin" className="mt-3 inline-flex rounded-md border border-primary/40 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10">
                  Open enquiry dashboard
                </Link>
              </div>

              <h1 className="text-3xl font-bold text-foreground">Shop Admin</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Post new stock, process paid customer orders, and keep customers updated as the order moves forward.
              </p>
              {message && <p className="mt-3 text-sm text-primary">{message}</p>}

              <div className="mt-8 grid gap-8 lg:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-6">
                  <h2 className="text-xl font-semibold text-foreground">Add product</h2>
                  <form onSubmit={createProduct} className="mt-4 space-y-3">
                    <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Product name" className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm" />
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm" rows={3} />
                    <div className="grid grid-cols-2 gap-3">
                      <input required type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price" className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm" />
                      <input required type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="Stock" className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm" />
                    </div>
                    <div className="flex gap-2">
                      <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL (optional)" className="flex-1 rounded-md border border-border bg-input px-3 py-2 text-sm" />
                      <label className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm bg-background cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file || !token) return;
                            try {
                              setUploading(true);
                              setMessage("");
                              const res = await uploadAdminImage(token, file);
                              setImageUrl(res.imageUrl);
                              setMessage("Image uploaded.");
                            } catch (err) {
                              setMessage((err as Error).message || "Upload failed");
                            } finally {
                              setUploading(false);
                            }
                          }}
                          className="hidden"
                        />
                        {uploading ? "Uploading..." : "Upload"}
                      </label>
                    </div>
                    <button type="submit" className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Create stock item</button>
                  </form>
                </div>

                <div className="rounded-xl border border-border bg-card p-6">
                  <h2 className="text-xl font-semibold text-foreground">Current products</h2>
                  <div className="mt-3 mb-3">
                    <input
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="mt-4 space-y-3">
                    {products
                      .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((product) => (
                        <div key={product.id} className="rounded-lg border border-border p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium text-foreground">{product.name}</p>
                              <p className="text-xs text-muted-foreground">R{Number(product.price).toFixed(2)} | Stock: {product.stock}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleEditProduct(product)} className="text-xs text-primary hover:underline">
                                Edit
                              </button>
                              <button onClick={() => handleDeleteProduct(product.id)} className="text-xs text-destructive hover:underline">
                                Delete
                              </button>
                              <button onClick={() => toggleProduct(product)} className="text-xs text-primary hover:underline">
                                {product.is_active ? "Deactivate" : "Activate"}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    {products.length === 0 && <p className="text-sm text-muted-foreground">No products created yet.</p>}
                  </div>
                </div>
              </div>

              <div className="mt-10 rounded-xl border border-border bg-card p-6">
                <h2 className="text-xl font-semibold text-foreground">Customer orders</h2>
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-muted-foreground">
                        <th className="px-3 py-2">Order</th>
                        <th className="px-3 py-2">Customer</th>
                        <th className="px-3 py-2">Payment</th>
                        <th className="px-3 py-2">Process</th>
                        <th className="px-3 py-2">Location note</th>
                        <th className="px-3 py-2">History</th>
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id} className="border-b border-border/50">
                          <td className="px-3 py-2">{order.orderNumber || `#${order.id}`} ({getChargeText(order.total, order.currency)})</td>
                          <td className="px-3 py-2">{order.customer_name}<br /><span className="text-xs text-muted-foreground">{order.customer_email}</span></td>
                          <td className="px-3 py-2">{formatPaymentStatus(order.payment_status)}</td>
                          <td className="px-3 py-2">{formatProcessingStatus(order.processing_status)}</td>
                          <td className="px-3 py-2">
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-foreground">
                                {getOrderLocation(order.processing_status, order.payment_status, order.location_note)}
                              </p>
                              <input
                                value={locationNotes[order.id] ?? ""}
                                onChange={(e) =>
                                  setLocationNotes((prev) => ({
                                    ...prev,
                                    [order.id]: e.target.value,
                                  }))
                                }
                                placeholder="Courier hub - Emalahleni"
                                className="w-56 rounded-md border border-border bg-input px-2 py-1 text-xs"
                              />
                            </div>
                          </td>
                          <td className="px-3 py-2 align-top">
                            {order.location_history.length === 0 ? (
                              <span className="text-xs text-muted-foreground">No updates yet</span>
                            ) : (
                              <div className="space-y-1.5">
                                {order.location_history.slice(0, 3).map((entry, index) => (
                                  <div key={`${order.id}-admin-history-${index}`} className="rounded-md border border-border/70 bg-muted/10 px-2 py-1 text-xs">
                                    <p className="font-semibold text-foreground">{entry.location_note || formatProcessingStatus(entry.processing_status)}</p>
                                    <p className="text-muted-foreground">{entry.admin_name} · {formatOrderDate(entry.created_at)}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2">{formatOrderDate(order.created_at)}</td>
                          <td className="px-3 py-2">
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <select
                                  value={order.processing_status}
                                  onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                  disabled={order.payment_status !== "paid"}
                                  className="rounded-md border border-border bg-input px-2 py-1 text-xs"
                                >
                                  <option value="new">new</option>
                                  <option value="processing">processing</option>
                                  <option value="completed">completed</option>
                                  <option value="cancelled">cancelled</option>
                                </select>
                                <button
                                  onClick={() => updateOrderStatus(order.id, order.processing_status)}
                                  disabled={order.payment_status !== "paid"}
                                  className="rounded-md border border-primary/40 px-2 py-1 text-xs text-primary hover:bg-primary/10 disabled:opacity-50"
                                >
                                  Save
                                </button>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleCancelOrder(order.id)}
                                  disabled={order.payment_status !== "paid" || order.processing_status === "cancelled"}
                                  className="rounded-md border border-destructive/40 px-2 py-1 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrder(normalizeOrder(order))}
                                  className="rounded-md border border-border px-2 py-1 text-xs text-foreground hover:bg-muted/20"
                                >
                                  Details
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {orders.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">No orders yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
      <Sheet open={Boolean(activeOrder)} onOpenChange={(open) => { if (!open) setSelectedOrder(null); }}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          {activeOrder && (
            <div className="flex h-full flex-col gap-5">
              <SheetHeader>
                <SheetTitle>Order #{activeOrder.id}</SheetTitle>
                <SheetDescription>
                  {activeOrder.customer_name} · {activeOrder.customer_email}
                </SheetDescription>
              </SheetHeader>

              <div className="grid gap-3 rounded-xl border border-border bg-card p-4 text-sm sm:grid-cols-2">
                <Info label="Charged" value={getChargeText(activeOrder.total, activeOrder.currency)} />
                <Info label="Payment" value={formatPaymentStatus(activeOrder.payment_status)} />
                <Info label="Processing" value={formatProcessingStatus(activeOrder.processing_status)} />
                <Info label="Current location" value={getOrderLocation(activeOrder.processing_status, activeOrder.payment_status, activeOrder.location_note)} />
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Order items</h3>
                <div className="mt-3 space-y-2">
                  {activeOrder.items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No item details available.</p>
                  ) : (
                    activeOrder.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-muted/10 px-3 py-2 text-sm">
                        <div>
                          <p className="font-medium text-foreground">{item.productName}</p>
                          <p className="text-xs text-muted-foreground">Qty {item.quantity} · {getChargeText(item.unitPrice, activeOrder.currency)} each</p>
                        </div>
                        <p className="font-semibold text-foreground">{getChargeText(item.subtotal, activeOrder.currency)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Location history</h3>
                <div className="mt-3 space-y-3">
                  {activeOrder.location_history.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No updates yet.</p>
                  ) : (
                    activeOrder.location_history.map((entry, index) => (
                      <div key={`${activeOrder.id}-drawer-history-${index}`} className="rounded-lg border border-border/70 bg-muted/10 px-3 py-2 text-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-foreground">{entry.location_note || formatProcessingStatus(entry.processing_status)}</p>
                            <p className="mt-1 text-xs text-muted-foreground">Updated by {entry.admin_name}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">{formatOrderDate(entry.created_at)}</span>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">{formatProcessingStatus(entry.processing_status)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Admin action</h3>
                <div className="mt-3 flex flex-col gap-3">
                  <input
                    value={locationNotes[activeOrder.id] ?? ""}
                    onChange={(e) =>
                      setLocationNotes((prev) => ({
                        ...prev,
                        [activeOrder.id]: e.target.value,
                      }))
                    }
                    placeholder="Update location or note"
                    className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm"
                  />
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={activeOrder.processing_status}
                      onChange={(e) => updateOrderStatus(activeOrder.id, e.target.value)}
                      disabled={activeOrder.payment_status !== "paid"}
                      className="rounded-md border border-border bg-input px-3 py-2 text-sm"
                    >
                      <option value="new">new</option>
                      <option value="processing">processing</option>
                      <option value="completed">completed</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => updateOrderStatus(activeOrder.id, activeOrder.processing_status)}
                      disabled={activeOrder.payment_status !== "paid"}
                      className="rounded-md border border-primary/40 px-3 py-2 text-sm text-primary hover:bg-primary/10 disabled:opacity-50"
                    >
                      Save note
                    </button>
                  </div>
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
