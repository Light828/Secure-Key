import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Enquiry } from "./enquiries";
import type { AdminStats, AdminUser, Order } from "./shop-api";

const PRICING: Record<string, string> = {
  "Emergency Lockout": "R350 – R800",
  "Key Cutting": "R50 – R500",
  "Lock Change / Rekey": "R250 – R1,000",
  "Car Key Programming": "R800 – R2,500",
  "Commercial Security": "R350 – R5,000",
  "Safe Services": "R350 – R3,000",
  Other: "Quote on request",
};

export function generateEnquiryPDF(enquiry: Enquiry) {
  const doc = new jsPDF();
  const gold = [180, 140, 50] as const;
  const dark = [20, 24, 35] as const;

  // Header bar
  doc.setFillColor(...dark);
  doc.rect(0, 0, 210, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("SECUREKEY LOCKSMITH", 15, 22);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Witbank | 013 100 1234 | info@securekeywitbank.co.za", 15, 32);

  // Title
  doc.setTextColor(...dark);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("ENQUIRY REPORT", 15, 55);

  // Reference line
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text(`Reference: ${enquiry.id.slice(0, 8).toUpperCase()}`, 15, 62);
  doc.text(
    `Generated: ${new Date().toLocaleString("en-ZA")}`,
    210 - 15,
    62,
    { align: "right" }
  );

  // Divider
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.8);
  doc.line(15, 66, 195, 66);

  // Customer Details Table
  autoTable(doc, {
    startY: 73,
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: {
      fillColor: [...dark],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    head: [["CUSTOMER DETAILS", ""]],
    body: [
      ["Full Name", enquiry.name],
      ["Phone Number", enquiry.phone],
      ["Email Address", enquiry.email || "Not provided"],
      [
        "Enquiry Date",
        new Date(enquiry.created_at).toLocaleString("en-ZA"),
      ],
      ["Status", enquiry.status.toUpperCase()],
    ],
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 55 },
    },
  });

  // Service & Pricing Table
  const pricing = PRICING[enquiry.service] || PRICING["Other"];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable?.finalY || 140;

  autoTable(doc, {
    startY: finalY + 10,
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: {
      fillColor: [...dark],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    head: [["SERVICE & PRICING", ""]],
    body: [
      ["Service Requested", enquiry.service],
      ["Estimated Price Range", pricing],
    ],
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 55 },
    },
  });

  // Message section
  if (enquiry.message) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const msgY = (doc as any).lastAutoTable?.finalY || 180;
    autoTable(doc, {
      startY: msgY + 10,
      theme: "plain",
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: {
        fillColor: [...dark],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      head: [["CUSTOMER MESSAGE"]],
      body: [[enquiry.message]],
    });
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    "SecureKey Locksmith Witbank | 23 Mandela St, Witbank, Mpumalanga 1035 | PSIRA Registered",
    105,
    285,
    { align: "center" }
  );
  doc.text(
    "Prices are estimates. Final pricing depends on the specific job, lock type, and time of service.",
    105,
    290,
    { align: "center" }
  );

  // Download
  doc.save(`SecureKey-Enquiry-${enquiry.id.slice(0, 8)}.pdf`);
}

function money(value: number | null | undefined) {
  return `R${Number(value || 0).toFixed(2)}`;
}

function statusLabel(status: string | null | undefined) {
  return (status || "unknown").replaceAll("_", " ");
}

export function generateSystemReportPDF(data: {
  stats: AdminStats | null;
  users: AdminUser[];
  orders: Order[];
}) {
  const doc = new jsPDF();
  const gold = [180, 140, 50] as const;
  const dark = [20, 24, 35] as const;
  const reportDate = new Date().toLocaleString("en-ZA");

  doc.setFillColor(...dark);
  doc.rect(0, 0, 210, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("SECUREKEY LOCKSMITH", 15, 22);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("System Report | Witbank | 013 100 1234", 15, 32);

  doc.setTextColor(...dark);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("ADMIN SYSTEM REPORT", 15, 55);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text(`Generated: ${reportDate}`, 15, 62);
  doc.text(
    `Users: ${data.users.length} | Orders: ${data.orders.length}`,
    210 - 15,
    62,
    { align: "right" }
  );

  doc.setDrawColor(...gold);
  doc.setLineWidth(0.8);
  doc.line(15, 66, 195, 66);

  autoTable(doc, {
    startY: 74,
    theme: "grid",
    headStyles: {
      fillColor: [...dark],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: { fontSize: 10, cellPadding: 4 },
    head: [["SUMMARY", "VALUE"]],
    body: [
      ["Total Users", String(data.stats?.totalUsers ?? data.users.length)],
      ["Admin Users", String(data.stats?.adminUsers ?? data.users.filter((user) => user.role === "admin").length)],
      ["Total Orders", String(data.stats?.totalOrders ?? data.orders.length)],
      ["Total Revenue", money(data.stats?.totalRevenue ?? data.orders.reduce((sum, order) => sum + Number(order.total || 0), 0))],
      ["This Month Revenue", money(data.stats?.monthRevenue ?? 0)],
    ],
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 60 } },
  });

  const summaryY = (doc as any).lastAutoTable?.finalY || 110;
  autoTable(doc, {
    startY: summaryY + 10,
    theme: "grid",
    headStyles: {
      fillColor: [...dark],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: { fontSize: 9, cellPadding: 3 },
    head: [["RECENT USERS", "EMAIL", "ROLE", "VERIFIED"]],
    body: data.users.slice(0, 8).map((user) => [
      user.name,
      user.email,
      user.role,
      user.verified ? "Yes" : "No",
    ]),
  });

  const usersY = (doc as any).lastAutoTable?.finalY || summaryY + 40;
  autoTable(doc, {
    startY: usersY + 10,
    theme: "grid",
    headStyles: {
      fillColor: [...dark],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: { fontSize: 9, cellPadding: 3 },
    head: [["RECENT ORDERS", "CUSTOMER", "PAYMENT", "PROCESSING", "TOTAL"]],
    body: data.orders.slice(0, 8).map((order) => [
      order.orderNumber || `#${order.id}`,
      order.customerName || "Customer",
      statusLabel(order.payment_status),
      statusLabel(order.processing_status),
      money(order.total),
    ]),
  });

  const footerY = 285;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    "SecureKey Locksmith Witbank | Admin System Report",
    105,
    footerY,
    { align: "center" }
  );
  doc.text(
    "This report is generated from current dashboard data and can be used for presentation or record keeping.",
    105,
    footerY + 5,
    { align: "center" }
  );

  doc.save(`SecureKey-System-Report-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function downloadUsersCsv(users: AdminUser[]) {
  const header = ["id", "name", "email", "role", "verified", "createdAt"];
  const rows = users.map((user) => [
    user.id,
    user.name,
    user.email,
    user.role,
    user.verified ? "Yes" : "No",
    user.createdAt || "",
  ]);

  const escapeCsv = (value: string | number | boolean | null | undefined) => {
    const text = String(value ?? "");
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };

  const csv = [header, ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `SecureKey-Users-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
