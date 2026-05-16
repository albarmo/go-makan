export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCompactRupiah(amount: number): string {
  if (amount >= 1000) {
    const value = amount / 1000;
    const rounded = Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);
    return `Rp ${rounded.replace(".0", "")}k`;
  }
  return formatRupiah(amount).replace("Rp", "Rp ");
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(dateStr + "T00:00:00"));
}

export function formatShortDate(date: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatRelativeOrderTime(date: Date | string): string {
  const target = new Date(date);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate()
  );
  const dayDiff = Math.round(
    (startOfToday.getTime() - startOfTarget.getTime()) / 86400000
  );

  const label =
    dayDiff === 0 ? "Hari ini" : dayDiff === 1 ? "Kemarin" : `${dayDiff} hari lalu`;

  return `${label}, ${formatTime(target)}`;
}

export function todayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildOrderSummary(
  items: { menuNameSnapshot?: string; menuName?: string; quantity: number }[]
): string {
  return items
    .map((item) => `${item.quantity}x ${item.menuNameSnapshot ?? item.menuName ?? "Menu"}`)
    .join(", ");
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    submitted: "Menunggu Dibeli",
    purchased: "Sudah Dibeli",
    cancelled: "Dibatalkan",
  };
  return labels[status] ?? status;
}

export function statusBadgeClass(status: string): string {
  const classes: Record<string, string> = {
    submitted: "badge-submitted",
    purchased: "badge-purchased",
    cancelled: "badge-cancelled",
  };
  return classes[status] ?? "badge-submitted";
}

export function paymentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    unpaid: "Belum Bayar",
    paid: "Lunas",
  };
  return labels[status] ?? status;
}

export function paymentStatusBadgeClass(status: string): string {
  const classes: Record<string, string> = {
    unpaid: "badge-submitted",
    paid: "badge-purchased",
  };
  return classes[status] ?? "badge-submitted";
}
