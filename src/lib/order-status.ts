export type PaymentStatus = "pending" | "paid" | "failed";
export type ProcessingStatus = "awaiting_payment" | "new" | "processing" | "completed" | "cancelled";
export type TimelineState = "done" | "current" | "upcoming";

export interface TimelineStep {
  key: "paid" | "processing" | "ready" | "completed";
  label: string;
  state: TimelineState;
}

const processingStatusLabels: Record<ProcessingStatus, string> = {
  awaiting_payment: "Awaiting payment",
  new: "Ready",
  processing: "Processing",
  completed: "Completed",
  cancelled: "Cancelled",
};

const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
};

export function formatOrderDate(value: string | null | undefined) {
  if (!value) {
    return "Pending timestamp";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Pending timestamp";
  }

  return parsed.toLocaleString();
}

export function formatPaymentStatus(value: string) {
  return paymentStatusLabels[value as PaymentStatus] ?? value;
}

export function formatProcessingStatus(value: string) {
  return processingStatusLabels[value as ProcessingStatus] ?? value;
}

export function getOrderTimeline(paymentStatus: string, processingStatus: string): TimelineStep[] {
  const steps: TimelineStep[] = [
    { key: "paid", label: "Paid", state: "upcoming" },
    { key: "processing", label: "Processing", state: "upcoming" },
    { key: "ready", label: "Ready", state: "upcoming" },
    { key: "completed", label: "Completed", state: "upcoming" },
  ];

  if (paymentStatus !== "paid") {
    steps[0].state = "current";
    return steps;
  }

  steps[0].state = "done";

  if (processingStatus === "awaiting_payment" || processingStatus === "new") {
    steps[1].state = "current";
    return steps;
  }

  if (processingStatus === "processing") {
    steps[1].state = "done";
    steps[2].state = "current";
    return steps;
  }

  if (processingStatus === "completed") {
    steps[1].state = "done";
    steps[2].state = "done";
    steps[3].state = "done";
    return steps;
  }

  if (processingStatus === "cancelled") {
    steps[1].state = "done";
    steps[2].state = "done";
    steps[3].state = "upcoming";
    return steps;
  }

  return steps;
}

export function isOrderCancelled(processingStatus: string) {
  return processingStatus === "cancelled";
}

export function getOrderLocation(processingStatus: string, paymentStatus: string, locationNote?: string | null) {
  if (locationNote && locationNote.trim()) {
    return locationNote.trim();
  }

  if (paymentStatus !== "paid") {
    return "Awaiting payment confirmation";
  }

  switch (processingStatus) {
    case "awaiting_payment":
      return "Payment gateway review";
    case "new":
      return "Witbank dispatch center";
    case "processing":
      return "On route to customer";
    case "completed":
      return "Delivered to customer";
    case "cancelled":
      return "Order cancelled";
    default:
      return "Location updating";
  }
}

export function getChargeText(total: number, currency?: string) {
  const safeCurrency = (currency || "ZAR").toUpperCase();
  if (safeCurrency === "ZAR") {
    return `R${Number(total).toFixed(2)}`;
  }
  return `${safeCurrency} ${Number(total).toFixed(2)}`;
}
