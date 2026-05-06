import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Enquiry } from "./enquiries";

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
