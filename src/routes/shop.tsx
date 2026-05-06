import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getProducts, addToCart, type Product } from "@/lib/shop-api";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/shop")({
  component: ShopPage,
  head: () => ({
    meta: [{ title: "Shop | SecureKey Locksmith" }],
  }),
});

function ShopPage() {
  const { token, isAuthenticated } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    getProducts()
      .then((res) => {
        if (mounted) setProducts(res.products);
      })
      .catch((err) => {
        if (mounted) setMessage(err.message || "Failed to load products");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleAddToCart = async (productId: number) => {
    setMessage("");

    if (!isAuthenticated || !token) {
      setMessage("Please login first to add products to cart.");
      return;
    }

    try {
      await addToCart(token, productId, 1);
      setMessage("Product added to cart.");
    } catch (error) {
      setMessage((error as Error).message || "Failed to add product");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 overflow-hidden rounded-3xl border border-border bg-card/80 p-6 sm:p-8">
            <div className="absolute" />
            <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-primary">Secure shopping</p>
                <h1 className="mt-2 text-4xl font-bold text-foreground sm:text-5xl">Online Store</h1>
                <p className="mt-3 max-w-2xl text-muted-foreground">
                  Premium locksmith products with fast checkout and live order tracking.
                </p>
              </div>
              <Link
                to="/cart"
                className="inline-flex items-center justify-center rounded-xl border border-primary/40 bg-primary/10 px-5 py-2.5 text-sm font-semibold text-primary transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/20"
              >
                Open Cart
              </Link>
            </div>
          </div>

          {message && (
            <div className="mb-4 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
              {message}
            </div>
          )}

          {loading ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">No stock available yet.</div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <article
                  key={product.id}
                  className="group overflow-hidden rounded-2xl border border-border bg-card/90 transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/45 hover:shadow-gold"
                >
                  <div className="relative overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-48 w-full bg-muted" />
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </div>

                  <div className="p-5">
                    <h2 className="text-lg font-semibold text-foreground">{product.name}</h2>
                    <p className="mt-1 min-h-12 text-sm text-muted-foreground">{product.description || "No description"}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">R{Number(product.price).toFixed(2)}</span>
                      <span className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground">
                        Stock: {product.stock}
                      </span>
                    </div>
                    <button
                      onClick={() => handleAddToCart(product.id)}
                      disabled={product.stock <= 0}
                      className="mt-4 w-full rounded-xl bg-gradient-gold px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {product.stock > 0 ? "Add to cart" : "Out of stock"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
