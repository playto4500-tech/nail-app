import { getTodayDateKey } from "../utils/date";
import { formatPrice } from "./format";

export type AppointmentStatus = "confirmed" | "cancelled" | "scheduled" | "completed";

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

export function getStatusLabel(status: AppointmentStatus) {
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

export function getStatusClasses(status: AppointmentStatus) {
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
