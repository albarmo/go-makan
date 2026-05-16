export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(dateStr + "T00:00:00"));
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

export function todayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
