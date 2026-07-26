import { getTodayDateKey } from "../utils/date";
import { formatPrice } from "./format";

export type AppointmentStatus = "confirmed" | "cancelled" | "scheduled" | "completed";
export type DisplayAppointmentStatus = AppointmentStatus | "overdue";

export type AppointmentCompletionState = {
  price: number;
  tip: number;
  addonNames: string[];
};

export type ToastMessage = {
  message: string;
  tone: "success" | "error";
};

export function formatAppointmentDate(date: string) {
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(`${date}T12:00:00`));
}

export function formatSectionDate(date: string) {
  const formatted = new Intl.DateTimeFormat("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${date}T12:00:00`));

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatLongDate(date: string) {
  const formatted = new Intl.DateTimeFormat("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function getAppointmentPaidTotal(price: number, tip?: null | number) {
  return price + (tip ?? 0);
}

export function getCurrentTimeKey(now = new Date()) {
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function getDisplayStatus(input: {
  date: string;
  status: AppointmentStatus;
  time: string;
}, now = new Date()): DisplayAppointmentStatus {
  if (input.status === "completed" || input.status === "cancelled") {
    return input.status;
  }

  const todayDateKey = getTodayDateKey(now);
  const currentTimeKey = getCurrentTimeKey(now);
  const appointmentTime = input.time.slice(0, 5);

  if (
    input.date < todayDateKey ||
    (input.date === todayDateKey && appointmentTime < currentTimeKey)
  ) {
    return "overdue";
  }

  return input.status;
}

export function getStatusLabel(status: DisplayAppointmentStatus) {
  if (status === "overdue") {
    return "Zaległa";
  }

  if (status === "confirmed") {
    return "Potwierdzona";
  }

  if (status === "cancelled") {
    return "Anulowana";
  }

  if (status === "completed") {
    return "Zakończona";
  }

  return "Zaplanowana";
}

export function getStatusClasses(status: DisplayAppointmentStatus) {
  if (status === "overdue") {
    return "bg-red-100 text-red-700";
  }

  if (status === "confirmed") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "cancelled") {
    return "bg-rose-100 text-rose-700";
  }

  if (status === "completed") {
    return "bg-slate-900 text-white";
  }

  return "bg-amber-100 text-amber-700";
}

export { formatPrice, getTodayDateKey };
