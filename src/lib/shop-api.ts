import { apiFetch } from "@/lib/api";
import { API_BASE } from "@/lib/api";

export interface SessionUserPayload {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  addressLine?: string | null;
  city?: string | null;
  role: "client" | "admin";
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  addressLine?: string;
  city?: string;
  postalCode?: string;
  province?: string;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  image_url: string | null;
  is_active: number;
}

export interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  image_url: string | null;
  subtotal: number;
}

export interface CartResponse {
  items: CartItem[];
  total: number;
}

export interface OrderItem {
  id: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

type RawOrderItem = Partial<OrderItem> & {
  product_name?: string;
  unit_price?: number;
};

export interface OrderLocationHistoryItem {
  admin_name: string;
  processing_status: "awaiting_payment" | "new" | "processing" | "completed" | "cancelled";
  location_note: string | null;
  created_at: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  total: number;
  currency: string;
  payment_status: "pending" | "paid" | "failed";
  processing_status: "awaiting_payment" | "new" | "processing" | "completed" | "cancelled";
  location_note: string | null;
  items: OrderItem[];
  location_history: OrderLocationHistoryItem[];
  created_at: string;
}

function normalizeOrderItems(items: RawOrderItem[] | null | undefined): OrderItem[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item) => ({
    id: Number(item.id ?? 0),
    productName: item.productName ?? item.product_name ?? "",
    quantity: Number(item.quantity ?? 0),
    unitPrice: Number(item.unitPrice ?? item.unit_price ?? 0),
    subtotal: Number(item.subtotal ?? 0),
  }));
}

type RawOrderLocationHistoryItem = Partial<OrderLocationHistoryItem> & {
  adminName?: string;
  processingStatus?: string;
  locationNote?: string | null;
  createdAt?: string;
};

function normalizeOrderLocationHistory(items: RawOrderLocationHistoryItem[] | null | undefined): OrderLocationHistoryItem[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item) => ({
    admin_name: item.admin_name ?? item.adminName ?? "Admin",
    processing_status: (item.processing_status ?? item.processingStatus ?? "awaiting_payment") as OrderLocationHistoryItem["processing_status"],
    location_note: item.location_note ?? item.locationNote ?? null,
    created_at: item.created_at ?? item.createdAt ?? new Date().toISOString(),
  }));
}

function normalizeOrder<T extends {
  location_history?: RawOrderLocationHistoryItem[] | null;
  locationHistory?: RawOrderLocationHistoryItem[] | null;
  items?: RawOrderItem[] | null;
  orderNumber?: string;
  order_number?: string;
  customerName?: string;
  customer_name?: string;
  customerEmail?: string;
  customer_email?: string;
  paymentStatus?: Order["payment_status"];
  payment_status?: Order["payment_status"];
  processingStatus?: Order["processing_status"];
  processing_status?: Order["processing_status"];
  locationNote?: string | null;
  location_note?: string | null;
  createdAt?: string;
  created_at?: string;
}>(order: T) {
  return {
    ...order,
    orderNumber: order.orderNumber ?? order.order_number ?? "",
    customerName: order.customerName ?? order.customer_name ?? "",
    customerEmail: order.customerEmail ?? order.customer_email ?? "",
    payment_status: order.payment_status ?? order.paymentStatus ?? "pending",
    processing_status: order.processing_status ?? order.processingStatus ?? "awaiting_payment",
    location_note: order.location_note ?? order.locationNote ?? null,
    created_at: order.created_at ?? order.createdAt ?? new Date().toISOString(),
    items: normalizeOrderItems(order.items),
    location_history: normalizeOrderLocationHistory(order.location_history ?? order.locationHistory),
  } as Order;
}

type AdminOrder = Order & {
  customerName: string;
  customerEmail: string;
};

function normalizeAdminOrder<T extends Parameters<typeof normalizeOrder>[0]>(order: T) {
  const normalized = normalizeOrder(order) as AdminOrder;
  return {
    ...normalized,
    customerName: (order as { customerName?: string; customer_name?: string }).customerName ?? (order as { customer_name?: string }).customer_name ?? "",
    customerEmail: (order as { customerEmail?: string; customer_email?: string }).customerEmail ?? (order as { customer_email?: string }).customer_email ?? "",
  };
}

export async function getProducts() {
  return apiFetch<{ products: Product[] }>("/api/products");
}

export async function register(payload: RegisterPayload) {
  return apiFetch<{ message: string }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function verifyAccount(token: string) {
  return apiFetch<{ message: string }>("/api/auth/verify", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export async function login(payload: { email: string; password: string }) {
  return apiFetch<{ token: string; user: SessionUserPayload }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getMyProfile(token: string) {
  return apiFetch<{ user: SessionUserPayload }>("/api/auth/me", { token });
}

export async function updateMyProfile(token: string, payload: { name: string; phone?: string; addressLine?: string; city?: string }) {
  return apiFetch<{ user: SessionUserPayload }>("/api/auth/profile", {
    token,
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function forgotPassword(email: string) {
  return apiFetch<{ message: string }>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(code: string, newPassword: string) {
  return apiFetch<{ message: string }>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ code, newPassword }),
  });
}

export async function getCart(token: string) {
  return apiFetch<CartResponse>("/api/cart", { token });
}

export async function addToCart(token: string, productId: number, quantity: number) {
  return apiFetch<CartResponse>("/api/cart/add", {
    token,
    method: "POST",
    body: JSON.stringify({ productId, quantity }),
  });
}

export async function updateCartItem(token: string, itemId: number, quantity: number) {
  return apiFetch<CartResponse>(`/api/cart/${itemId}`, {
    token,
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });
}

export async function removeCartItem(token: string, itemId: number) {
  return apiFetch<CartResponse>(`/api/cart/${itemId}`, {
    token,
    method: "DELETE",
  });
}

export interface DeliveryFeeRequest {
  deliveryType: 'collect' | 'deliver';
  address?: string;
  collectTime?: string;
}

export interface DeliveryFeeResponse {
  deliveryType: string;
  distanceKm: number;
  deliveryFee: number;
  addressRequired: boolean;
  collectTimeRequired: boolean;
}

export async function calculateDeliveryFee(token: string, request: DeliveryFeeRequest): Promise<DeliveryFeeResponse> {
  return apiFetch('/api/cart/calculate-delivery-fee', {
    token,
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function createCheckoutSession(token: string | null, params: {
  amountCents: number;
  description: string;
  successUrl: string;
  cancelUrl: string;
}) {
  return apiFetch<{ url: string; sessionId?: string }>("/api/payments/create-checkout-session", {
    token,
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function confirmStripePayment(
  token: string,
  sessionId: string,
  deliveryType?: string,
  deliveryAddress?: string,
  deliveryDistanceKm?: number,
  deliveryFee?: number
) {
  return apiFetch<{ message: string; orderId: number; paymentStatus: string }>("/api/orders/confirm-stripe-payment", {
    token,
    method: "POST",
    body: JSON.stringify({ sessionId, deliveryType, deliveryAddress, deliveryDistanceKm, deliveryFee }),
  });
}

export async function createMockSession(params: {
  amountCents: number;
  description: string;
  successUrl: string;
  cancelUrl: string;
}) {
  return apiFetch<{ url: string }>("/api/payments/create-mock-session", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function createPaymentIntent(params: {
  amountCents: number;
  currency: 'ZAR';
  description: string;
}) {
  return apiFetch<{ client_secret: string }>("/api/payments/create-payment-intent", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function createPaypalOrder(token: string) {
  return apiFetch<{ paypalOrderId: string; approveLink: string | null; amount: number; currency: string }>("/api/orders/create-paypal-order", {
    token,
    method: "POST",
  });
}

export async function capturePaypalOrder(token: string, paypalOrderId: string) {
  return apiFetch<{ message: string; orderId: number }>("/api/orders/capture-paypal-order", {
    token,
    method: "POST",
    body: JSON.stringify({ paypalOrderId }),
  });
}

export async function getMyOrders(token: string) {
  const response = await apiFetch<{ orders: Order[] }>("/api/orders/my-orders", { token });
  return {
    ...response,
    orders: response.orders.map(normalizeOrder),
  };
}

export async function getAdminProducts(token: string) {
  return apiFetch<{ products: Product[] }>("/api/admin/products", { token });
}

export async function createAdminProduct(
  token: string,
  payload: { name: string; description: string; price: number; stock: number; imageUrl?: string; isActive: boolean }
) {
  return apiFetch<{ id: number }>("/api/admin/products", {
    token,
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAdminProduct(
  token: string,
  id: number,
  payload: { name: string; description: string; price: number; stock: number; imageUrl?: string; isActive: boolean }
) {
  return apiFetch<{ message: string }>(`/api/admin/products/${id}`, {
    token,
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminProduct(token: string, id: number) {
  return apiFetch<{ message: string }>(`/api/admin/products/${id}`, {
    token,
    method: "DELETE",
  });
}

export async function getAdminOrders(token: string) {
  const response = await apiFetch<{
    orders: Array<{
      id: number;
      orderNumber: string;
      total: number;
      currency: string;
      customerName?: string;
      customerEmail?: string;
      customer_name?: string;
      customer_email?: string;
      payment_status: "pending" | "paid" | "failed";
      processing_status: "awaiting_payment" | "new" | "processing" | "completed" | "cancelled";
      location_note: string | null;
      items: OrderItem[];
      location_history: OrderLocationHistoryItem[];
      created_at: string;
      customer_name: string;
      customer_email: string;
    }>;
  }>("/api/admin/orders", { token });
  return {
    ...response,
    orders: response.orders.map(normalizeAdminOrder),
  };
}

export async function updateAdminOrderStatus(token: string, id: number, processingStatus: string, locationNote?: string) {
  return apiFetch<{ message: string }>(`/api/admin/orders/${id}/status`, {
    token,
    method: "PATCH",
    body: JSON.stringify({ processingStatus, locationNote: locationNote ?? null }),
  });
}

export async function cancelAdminOrder(token: string, id: number, reason: string) {
  return apiFetch<{ message: string }>(`/api/admin/orders/${id}/cancel`, {
    token,
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function uploadAdminImage(token: string, file: File) {
  const form = new FormData();
  form.append("image", file);

  const resp = await fetch(`${API_BASE}/api/admin/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(text || "Upload failed");
  }

  return resp.json() as Promise<{ imageUrl: string }>;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: 'client' | 'admin';
  verified: boolean;
  createdAt: string;
  enabled: boolean;
}

export async function getAdminUsers(token: string) {
  return apiFetch<{ users: AdminUser[] }>("/api/admin/users", { token });
}

export interface UserUpdateRequest {
  name?: string;
  role?: 'client' | 'admin';
  disabled?: boolean;
}

export async function updateAdminUser(token: string, id: number, updates: UserUpdateRequest) {
  return apiFetch(`/api/admin/users/${id}`, {
    token,
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export interface AdminStats {
  totalUsers: number;
  adminUsers: number;
  totalOrders: number;
  monthRevenue: number;
  totalRevenue: number;
}

export async function getRevenueStats(token: string) {
  return apiFetch<AdminStats>("/api/admin/stats", { token });
}
