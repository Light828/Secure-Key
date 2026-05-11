import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Trash2,
  Eye,
  CheckCircle,
  ArrowLeft,
  Inbox,
  Search,
  Filter,
  FileDown,
  MessageCircle,
  ClipboardList,
  LayoutDashboard,
  ShoppingBag,
  UserCircle2,
  LogOut,
} from "lucide-react";
import {
  getEnquiries,
  updateEnquiryStatus,
  deleteEnquiry,
  type Enquiry,
} from "@/lib/enquiries";
import { downloadUsersCsv, generateEnquiryPDF, generateSystemReportPDF } from "@/lib/pdf-report";
import { getAdminOrders, getAdminUsers, getRevenueStats, updateAdminUser, AdminUser, AdminStats, UserUpdateRequest } from "@/lib/shop-api";
import { RevenueChart } from "@/components/ui/chart";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/use-auth";
import logoIcon from "@/assets/logo-icon.png";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "Admin Dashboard | SecureKey Locksmith" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function AdminPage() {
  const { user, logout, token } = useAuth();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "new" | "read" | "resolved">("all");
  const [selected, setSelected] = useState<Enquiry | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await getEnquiries();
    setEnquiries(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleStatusChange = async (id: string, status: Enquiry["status"]) => {
    await updateEnquiryStatus(id, status);
    await refresh();
    if (selected?.id === id) {
      setSelected((prev) => (prev ? { ...prev, status } : null));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this enquiry permanently?")) return;
    await deleteEnquiry(id);
    await refresh();
    if (selected?.id === id) setSelected(null);
  };

  const filtered = enquiries.filter((e) => {
    const matchesStatus = filterStatus === "all" || e.status === filterStatus;
    const matchesSearch =
      !search ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.phone.includes(search) ||
      e.service.toLowerCase().includes(search.toLowerCase()) ||
      (e.email || "").toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const statusBadge = (status: Enquiry["status"]) => {
    const styles = {
      new: "bg-primary/20 text-primary",
      read: "bg-accent/20 text-accent-foreground",
      resolved: "bg-emerald-500/20 text-emerald-400",
    };
    return (
      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider ${styles[status]}`}>
        {status}
      </span>
    );
  };

  const newCount = enquiries.filter((e) => e.status === "new").length;
  const readCount = enquiries.filter((e) => e.status === "read").length;
  const resolvedCount = enquiries.filter((e) => e.status === "resolved").length;

  const buildWhatsAppUrl = (e: Enquiry) => {
    const phone = e.phone.replace(/\D/g, "");
    const text = [
      `Hi ${e.name}, this is SecureKey Locksmith regarding your *${e.service}* enquiry.`,
      e.message ? `\nYou mentioned: "${e.message}"` : "",
      `\nHow can we help you today?`,
    ].filter(Boolean).join("");
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'enquiries' | 'orders' | 'reports'>('overview');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [orders, setOrders] = useState<Awaited<ReturnType<typeof getAdminOrders>>["orders"]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const loadUsers = async () => {
    if (!token) return;
    try {
      setUsersLoading(true);
      const data = await getAdminUsers(token);
      setUsers(data.users);
    } catch (error) {
      console.error('Failed to load users', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const loadStats = async () => {
    if (!token) return;
    try {
      setStatsLoading(true);
      const data = await getRevenueStats(token);
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadOrders = async () => {
    if (!token) return;
    try {
      setOrdersLoading(true);
      const data = await getAdminOrders(token);
      setOrders(data.orders);
    } catch (error) {
      console.error('Failed to load orders', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    loadStats();
    loadOrders();
  }, [token]);

  const handleUpdateUser = async (userId: number, updates: UserUpdateRequest) => {
    if (!token) return;
    try {
      await updateAdminUser(token, userId, updates);
      loadUsers(); // Reload
    } catch (error) {
      console.error('Failed to update user', error);
    }
  };

  const adminMenu = [
    { to: "/admin-shop", label: "Shop Dashboard", icon: LayoutDashboard },
    { to: "/admin", label: "Main Dashboard", icon: ClipboardList },
    { to: "/shop", label: "Store View", icon: ShoppingBag },
    { to: "/auth", label: "Profile", icon: UserCircle2 },
  ] as const;

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
              const isCurrent = item.to === "/admin";
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

          <section className="pt-8 pb-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {/* Header */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
                  <ArrowLeft className="h-4 w-4" /> Back to site
                </Link>
                <h1 className="text-4xl font-bold text-foreground">
                  Admin <span className="text-gradient-gold">Dashboard</span>
                </h1>
                <p className="mt-2 text-muted-foreground">Overview, Users, Orders, Reports</p>
              </motion.div>

              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="users">Users</TabsTrigger>
                  <TabsTrigger value="enquiries">Enquiries</TabsTrigger>
                  <TabsTrigger value="orders">Orders</TabsTrigger>
                  <TabsTrigger value="reports">Reports</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="mt-6 space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {stats && (
                      <>
                        <div className="p-6 bg-card rounded-xl border border-border text-center">
                          <p className="text-sm text-muted-foreground">Total Users</p>
                          <p className="text-3xl font-bold text-foreground">{stats.totalUsers}</p>
                        </div>
                        <div className="p-6 bg-card rounded-xl border border-border text-center">
                          <p className="text-sm text-muted-foreground">Admins</p>
                          <p className="text-3xl font-bold text-primary">{stats.adminUsers}</p>
                        </div>
                        <div className="p-6 bg-card rounded-xl border border-border text-center">
                          <p className="text-sm text-muted-foreground">Total Orders</p>
                          <p className="text-3xl font-bold text-foreground">{stats.totalOrders}</p>
                        </div>
                        <div className="p-6 bg-card rounded-xl border border-border text-center">
                          <p className="text-sm text-muted-foreground">This Month Revenue</p>
                          <p className="text-3xl font-bold text-emerald-500">R{stats.monthRevenue.toFixed(0)}</p>
                        </div>
                      </>
                    )}
                  </div>
                  {statsLoading ? (
                    <div className="p-12 bg-card rounded-xl border border-border text-center text-muted-foreground">Loading stats...</div>
                  ) : (
                    <RevenueChart data={[
                      { name: "Jan", revenue: 400, orders: 24 },
                      { name: "Feb", revenue: 300, orders: 20 },
                      { name: "Mar", revenue: 500, orders: 30 },
                      { name: "Apr", revenue: 600, orders: 35 },
                    ]} />
                  )}
                </TabsContent>
                <TabsContent value="users" className="mt-6">
                  <div className="rounded-xl border border-border bg-card">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Verified</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {usersLoading ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground">Loading users...</TableCell>
                          </TableRow>
                        ) : users.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground">No users</TableCell>
                          </TableRow>
                        ) : (
                          users.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell>{user.name}</TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell><Badge variant={user.role === 'admin' ? 'secondary' : 'default'}>{user.role}</Badge></TableCell>
                              <TableCell>{user.verified ? 'Yes' : 'No'}</TableCell>
                              <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm" onClick={() => handleUpdateUser(user.id, { role: user.role === 'client' ? 'admin' : 'client' })}>
                                  {user.role === 'admin' ? 'Demote' : 'Promote'}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                <TabsContent value="enquiries" className="mt-6">
                  {/* Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    {[
                      { label: "Total", value: enquiries.length, color: "text-foreground" },
                      { label: "New", value: newCount, color: "text-primary" },
                      { label: "Read", value: readCount, color: "text-accent-foreground" },
                      { label: "Resolved", value: resolvedCount, color: "text-emerald-400" },
                    ].map((s) => (
                      <div key={s.label} className="p-4 bg-card rounded-xl border border-border text-center">
                        <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                        <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Filters */}
                  <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search by name, phone, email, or service..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-input rounded-lg border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      {(["all", "new", "read", "resolved"] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => setFilterStatus(s)}
                          className={`px-3 py-1.5 text-xs rounded-lg border transition-colors capitalize ${filterStatus === s
                              ? "bg-primary/20 border-primary/40 text-primary"
                              : "border-border text-muted-foreground hover:border-primary/30"
                            }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-5 gap-6">
                    {/* Enquiry List */}
                    <div className="lg:col-span-3 space-y-3">
                      {loading ? (
                        <div className="p-12 bg-card rounded-xl border border-border text-center">
                          <p className="text-muted-foreground">Loading enquiries...</p>
                        </div>
                      ) : filtered.length === 0 ? (
                        <div className="p-12 bg-card rounded-xl border border-border text-center">
                          <Inbox className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                          <p className="text-muted-foreground">
                            {enquiries.length === 0
                              ? "No enquiries yet. They'll appear here when customers submit the contact form."
                              : "No enquiries match your filters."}
                          </p>
                        </div>
                      ) : (
                        filtered.map((e) => (
                          <motion.div
                            key={e.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={`p-4 bg-card rounded-xl border transition-all cursor-pointer ${selected?.id === e.id
                                ? "border-primary/60 shadow-gold"
                                : "border-border hover:border-primary/30"
                              }`}
                            onClick={() => {
                              setSelected(e);
                              if (e.status === "new") handleStatusChange(e.id, "read");
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-foreground truncate">{e.name}</span>
                                  {statusBadge(e.status)}
                                </div>
                                <p className="text-sm text-muted-foreground truncate">{e.service} — {e.phone}</p>
                                <p className="text-xs text-muted-foreground/60 mt-1">
                                  {new Date(e.created_at).toLocaleString("en-ZA")}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={(ev) => { ev.stopPropagation(); generateEnquiryPDF(e); }}
                                  title="Download PDF report"
                                  className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                                >
                                  <FileDown className="h-4 w-4" />
                                </button>
                                {e.status !== "resolved" && (
                                  <button
                                    onClick={(ev) => { ev.stopPropagation(); handleStatusChange(e.id, "resolved"); }}
                                    title="Mark resolved"
                                    className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-400 transition-colors"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </button>
                                )}
                                <button
                                  onClick={(ev) => { ev.stopPropagation(); handleDelete(e.id); }}
                                  title="Delete"
                                  className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>

                    {/* Detail Panel */}
                    <div className="lg:col-span-2">
                      {selected && (
                        <motion.div
                          key={selected.id}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="p-6 bg-card rounded-xl border border-border sticky top-24"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-foreground">Enquiry Details</h2>
                            {statusBadge(selected.status)}
                          </div>

                          <div className="space-y-4 text-sm">
                            <Field label="Name" value={selected.name} />
                            <Field label="Phone" value={selected.phone} href={`tel:${selected.phone}`} />
                            {selected.email && (
                              <Field label="Email" value={selected.email} href={`mailto:${selected.email}`} />
                            )}
                            <Field label="Service" value={selected.service} />
                            <Field label="Date" value={new Date(selected.created_at).toLocaleString("en-ZA")} />
                            {selected.message && (
                              <div>
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">Message</span>
                                <p className="mt-1 text-foreground bg-input p-3 rounded-lg whitespace-pre-wrap">{selected.message}</p>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="mt-6 flex flex-wrap gap-2">
                            <button
                              onClick={() => {
                                if (selected) generateEnquiryPDF(selected);
                              }}
                              className="flex-1 inline-flex items-center justify-center gap-2 py-2 bg-primary/20 text-primary rounded-lg text-sm font-medium hover:bg-primary/30 transition-colors"
                            >
                              <FileDown className="h-4 w-4" /> Download PDF
                            </button>
                            {selected.status !== "resolved" && (
                              <button
                                onClick={() => handleStatusChange(selected.id, "resolved")}
                                className="flex-1 inline-flex items-center justify-center gap-2 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/30 transition-colors"
                              >
                                <CheckCircle className="h-4 w-4" /> Resolve
                              </button>
                            )}
                            {selected.status === "resolved" && (
                              <button
                                onClick={() => handleStatusChange(selected.id, "new")}
                                className="flex-1 inline-flex items-center justify-center gap-2 py-2 bg-primary/20 text-primary rounded-lg text-sm font-medium hover:bg-primary/30 transition-colors"
                              >
                                <Eye className="h-4 w-4" /> Reopen
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(selected.id)}
                              className="inline-flex items-center justify-center gap-2 py-2 px-4 bg-destructive/20 text-destructive rounded-lg text-sm font-medium hover:bg-destructive/30 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" /> Delete
                            </button>
                          </div>

                          {/* Quick contact actions */}
                          <div className="mt-4 pt-4 border-t border-border flex gap-2">
                            <a
                              href={`tel:${selected.phone}`}
                              className="flex-1 text-center py-2 bg-gradient-gold text-primary-foreground rounded-lg text-sm font-medium hover:scale-[1.02] transition-transform"
                            >
                              Call Back
                            </a>
                            <a
                              href={buildWhatsAppUrl(selected)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 inline-flex items-center justify-center gap-2 py-2 bg-[#25D366] text-white rounded-lg text-sm font-medium hover:bg-[#20bd5a] transition-colors"
                            >
                              <MessageCircle className="h-4 w-4" /> WhatsApp
                            </a>
                          </div>
                        </motion.div>
                      )}
                      {!selected && (
                        <div className="p-10 bg-card rounded-xl border border-border text-center sticky top-24">
                          <Eye className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                          <p className="text-sm text-muted-foreground">Select an enquiry to view details</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="orders" className="mt-6">
                  <Link to="/admin-shop" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90">
                    Open Orders Dashboard
                  </Link>
                </TabsContent>
                <TabsContent value="reports" className="mt-6">
                  <div className="space-y-4">
                    <Button
                      onClick={() => generateSystemReportPDF({ stats, users, orders })}
                      className="w-full"
                      disabled={!stats || usersLoading || statsLoading || ordersLoading}
                    >
                      Export System Report (PDF)
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => downloadUsersCsv(users)}
                      disabled={usersLoading || users.length === 0}
                    >
                      Export Users Report (CSV)
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => generateSystemReportPDF({ stats, users, orders })}
                      disabled={ordersLoading || orders.length === 0}
                    >
                      Export Orders Report (PDF)
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function Field({ label, value, href }: { label: string; value: string | null | undefined; href?: string }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      {href && value ? (
        <a href={href} className="block mt-0.5 text-primary hover:underline">{value}</a>
      ) : (
        <p className="mt-0.5 text-foreground">{value || 'N/A'}</p>
      )}
    </div>
  );
}
