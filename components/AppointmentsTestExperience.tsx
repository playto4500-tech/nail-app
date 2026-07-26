"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import AppointmentDetailsModal from "./AppointmentDetailsModal";
import type { Appointment } from "../lib/data/appointments";
import type { ClientSummary } from "../lib/data/clients";
import type { ServiceItem } from "../lib/data/services";
import {
  formatPrice,
  formatSectionDate,
  getAppointmentPaidTotal,
  getDisplayStatus,
  getStatusLabel,
  getTodayDateKey,
  type AppointmentCompletionState,
  type DisplayAppointmentStatus,
  type ToastMessage,
} from "../lib/ui/appointments";

type Props = {
  appointments: Appointment[];
  clients: ClientSummary[];
  services: ServiceItem[];
};

type ViewMode = "upcoming" | "overdue" | "history";

type AppointmentGroup = {
  date: string;
  label: string;
  items: Appointment[];
};

const viewModes: Array<{ key: ViewMode; label: string }> = [
  { key: "upcoming", label: "Nadchodzące" },
  { key: "overdue", label: "Zaległe" },
  { key: "history", label: "Historia" },
];

function addDaysToDateKey(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T12:00:00`);
  date.setDate(date.getDate() + days);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getEndOfWeekDateKey(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00`);
  const day = date.getDay();
  const daysUntilSunday = day === 0 ? 0 : 7 - day;

  return addDaysToDateKey(dateKey, daysUntilSunday);
}

function getEndOfMonthDateKey(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00`);
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 12);

  const year = endOfMonth.getFullYear();
  const month = String(endOfMonth.getMonth() + 1).padStart(2, "0");
  const day = String(endOfMonth.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDaysBetweenDateKeys(fromDateKey: string, toDateKey: string) {
  const fromDate = new Date(`${fromDateKey}T12:00:00`);
  const toDate = new Date(`${toDateKey}T12:00:00`);
  const dayInMs = 1000 * 60 * 60 * 24;

  return Math.max(0, Math.round((toDate.getTime() - fromDate.getTime()) / dayInMs));
}

function getDisplayAppointment(
  appointment: Appointment,
  completedState: null | AppointmentCompletionState,
): Appointment {
  if (!completedState) {
    return appointment;
  }

  return {
    ...appointment,
    addonNames: completedState.addonNames,
    price: completedState.price,
    tip: completedState.tip,
    status: "completed",
  };
}

function getClientKey(appointment: Appointment) {
  return appointment.clientId
    ? `id:${appointment.clientId}`
    : `name:${appointment.clientName.toLocaleLowerCase("pl-PL")}`;
}

function formatLastVisitLabel(daysAgo: null | number) {
  if (daysAgo === null) {
    return "Ostatnia wizyta: brak historii";
  }

  if (daysAgo === 0) {
    return "Ostatnia wizyta: dzisiaj";
  }

  if (daysAgo === 1) {
    return "Ostatnia wizyta: 1 dzień temu";
  }

  return `Ostatnia wizyta: ${daysAgo} dni temu`;
}

function getStatusTone(status: DisplayAppointmentStatus) {
  if (status === "completed") {
    return "bg-slate-950 text-white ring-slate-950";
  }

  if (status === "confirmed") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }

  if (status === "cancelled") {
    return "bg-rose-50 text-rose-700 ring-rose-100";
  }

  if (status === "overdue") {
    return "bg-red-50 text-red-700 ring-red-100";
  }

  return "bg-amber-50 text-amber-700 ring-amber-100";
}

function groupByDate(items: Appointment[], direction: "asc" | "desc"): AppointmentGroup[] {
  const sortedItems = [...items].sort((a, b) => {
    const dateResult = a.date.localeCompare(b.date);
    const result = dateResult === 0 ? a.time.localeCompare(b.time) : dateResult;

    return direction === "asc" ? result : -result;
  });
  const groups = new Map<string, Appointment[]>();

  sortedItems.forEach((appointment) => {
    const currentGroup = groups.get(appointment.date) ?? [];
    currentGroup.push(appointment);
    groups.set(appointment.date, currentGroup);
  });

  return Array.from(groups.entries()).map(([date, groupedItems]) => ({
    date,
    label: formatSectionDate(date),
    items: groupedItems,
  }));
}

function DashboardCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </section>
  );
}

function MetricCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string | number;
  detail: string;
  tone: "blue" | "green" | "red" | "amber";
}) {
  const toneClassName = {
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    red: "bg-rose-50 text-rose-700 ring-rose-100",
  }[tone];

  return (
    <DashboardCard className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
          <p className="mt-1 text-xs font-medium text-slate-500">{detail}</p>
        </div>
        <span className={`h-10 w-10 rounded-lg ring-1 ${toneClassName}`} aria-hidden="true" />
      </div>
    </DashboardCard>
  );
}

function SegmentedControl({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}) {
  return (
    <div className="grid rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs font-semibold sm:w-auto sm:grid-cols-3">
      {viewModes.map((mode) => (
        <button
          key={mode.key}
          type="button"
          onClick={() => onChange(mode.key)}
          className={`rounded-md px-3 py-2 transition ${
            value === mode.key
              ? "bg-white text-slate-950 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}

export default function AppointmentsTestExperience({
  appointments,
  clients,
  services,
}: Props) {
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<null | number>(null);
  const [modalMode, setModalMode] = useState<"details" | "complete">("details");
  const [viewMode, setViewMode] = useState<ViewMode>("upcoming");
  const [toast, setToast] = useState<null | ToastMessage>(null);
  const [completedAppointmentStates, setCompletedAppointmentStates] = useState<
    Record<number, AppointmentCompletionState>
  >({});

  const todayDateKey = useMemo(() => getTodayDateKey(), []);
  const weekEndDateKey = useMemo(() => getEndOfWeekDateKey(todayDateKey), [todayDateKey]);
  const monthEndDateKey = useMemo(() => getEndOfMonthDateKey(todayDateKey), [todayDateKey]);

  const displayedAppointments = useMemo(
    () =>
      appointments.map((appointment) =>
        getDisplayAppointment(
          appointment,
          completedAppointmentStates[appointment.id] ?? null,
        ),
      ),
    [appointments, completedAppointmentStates],
  );

  const selectedAppointment = useMemo(
    () =>
      displayedAppointments.find(
        (appointment) => appointment.id === selectedAppointmentId,
      ) ?? null,
    [displayedAppointments, selectedAppointmentId],
  );

  const lastVisitDaysByClientKey = useMemo(() => {
    const lastCompletedDateByClientKey = new Map<string, string>();

    displayedAppointments.forEach((appointment) => {
      if (appointment.status !== "completed" || appointment.date > todayDateKey) {
        return;
      }

      const clientKey = getClientKey(appointment);
      const currentLastDate = lastCompletedDateByClientKey.get(clientKey);

      if (!currentLastDate || appointment.date > currentLastDate) {
        lastCompletedDateByClientKey.set(clientKey, appointment.date);
      }
    });

    return new Map(
      Array.from(lastCompletedDateByClientKey.entries()).map(([clientKey, date]) => [
        clientKey,
        getDaysBetweenDateKeys(date, todayDateKey),
      ]),
    );
  }, [displayedAppointments, todayDateKey]);

  const appointmentGroups = useMemo(() => {
    const activeAppointments = displayedAppointments.filter(
      (appointment) =>
        appointment.status !== "completed" && appointment.status !== "cancelled",
    );
    const upcoming = activeAppointments.filter(
      (appointment) => getDisplayStatus(appointment) !== "overdue",
    );
    const overdue = activeAppointments.filter(
      (appointment) => getDisplayStatus(appointment) === "overdue",
    );
    const history = displayedAppointments.filter(
      (appointment) =>
        appointment.status === "completed" || appointment.status === "cancelled",
    );
    const currentViewItems =
      viewMode === "history" ? history : viewMode === "overdue" ? overdue : upcoming;

    return {
      current: groupByDate(currentViewItems, viewMode === "history" ? "desc" : "asc"),
      upcoming,
      overdue,
      history,
      stats: {
        today: activeAppointments.filter((appointment) => appointment.date === todayDateKey)
          .length,
        week: activeAppointments.filter(
          (appointment) =>
            appointment.date >= todayDateKey && appointment.date <= weekEndDateKey,
        ).length,
        month: activeAppointments.filter(
          (appointment) =>
            appointment.date >= todayDateKey && appointment.date <= monthEndDateKey,
        ).length,
      },
    };
  }, [displayedAppointments, monthEndDateKey, todayDateKey, viewMode, weekEndDateKey]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  function openDetails(appointmentId: number) {
    setModalMode("details");
    setSelectedAppointmentId(appointmentId);
  }

  function openComplete(appointmentId: number) {
    setModalMode("complete");
    setSelectedAppointmentId(appointmentId);
  }

  function renderAppointmentCard(appointment: Appointment) {
    const displayStatus = getDisplayStatus(appointment) as DisplayAppointmentStatus;
    const canComplete = displayStatus !== "cancelled" && displayStatus !== "completed";
    const lastVisitDaysAgo = lastVisitDaysByClientKey.get(getClientKey(appointment)) ?? null;
    const paidTotal =
      displayStatus === "completed"
        ? getAppointmentPaidTotal(appointment.price ?? 0, appointment.tip)
        : null;

    return (
      <article
        key={appointment.id}
        className="group rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <button
          type="button"
          onClick={() => openDetails(appointment.id)}
          className="block w-full px-4 pb-4 pt-4 text-left focus:outline-none focus:ring-2 focus:ring-slate-300 sm:px-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold text-slate-950">{appointment.time}</p>
                <span
                  className={`rounded-md px-2 py-1 text-xs font-semibold ring-1 ${getStatusTone(displayStatus)}`}
                >
                  {getStatusLabel(displayStatus)}
                </span>
              </div>
              <h3 className="mt-3 truncate text-lg font-bold text-slate-950">
                {appointment.clientName}
              </h3>
              {appointment.clientInstagramHandle ? (
                <p className="mt-1 truncate text-sm font-medium text-slate-500">
                  {appointment.clientInstagramHandle}
                </p>
              ) : null}
            </div>

            {canComplete ? (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-100">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.4"
                >
                  <path d="m5 12 4 4L19 6" />
                </svg>
              </span>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
            <div className="rounded-lg bg-slate-50 px-3 py-2">
              <p className="text-xs font-medium text-slate-500">Usługa</p>
              <p className="mt-1 truncate font-semibold text-slate-900">
                {appointment.serviceName ?? "Nieustalona"}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2">
              <p className="text-xs font-medium text-slate-500">Dodatki</p>
              <p className="mt-1 truncate font-semibold text-slate-900">
                {appointment.addonNames.length > 0
                  ? appointment.addonNames.join(", ")
                  : "Brak"}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="min-w-0 truncate text-xs font-medium text-slate-400">
              {formatLastVisitLabel(lastVisitDaysAgo)}
            </p>
            {paidTotal !== null ? (
              <p className="text-sm font-bold text-slate-950">{formatPrice(paidTotal)}</p>
            ) : null}
          </div>
        </button>

        {canComplete ? (
          <div className="border-t border-slate-100 px-4 py-3 sm:px-5">
            <button
              type="button"
              onClick={() => openComplete(appointment.id)}
              className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              Zakończ wizytę
            </button>
          </div>
        ) : null}
      </article>
    );
  }

  return (
    <>
      {toast ? (
        <div className="fixed left-1/2 top-[4.75rem] z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2">
          <div
            className={`rounded-lg px-4 py-3 text-sm font-semibold shadow-lg ${
              toast.tone === "success"
                ? "bg-emerald-100 text-emerald-800 shadow-emerald-100"
                : "bg-rose-100 text-rose-800 shadow-rose-100"
            }`}
          >
            {toast.message}
          </div>
        </div>
      ) : null}

      <div className="space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.08em] text-blue-700 ring-1 ring-blue-100">
                  TEST
                </span>
                <span className="rounded-md bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
                  Wizyty
                </span>
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">
                Wizyty TEST
              </h1>
            </div>
            <Link
              href="/appointments/new"
              scroll={false}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              Nowa wizyta
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Dzisiaj"
            value={appointmentGroups.stats.today}
            detail="Aktywne wizyty"
            tone="blue"
          />
          <MetricCard
            label="Tydzień"
            value={appointmentGroups.stats.week}
            detail="Do końca tygodnia"
            tone="green"
          />
          <MetricCard
            label="Miesiąc"
            value={appointmentGroups.stats.month}
            detail="Do końca miesiąca"
            tone="amber"
          />
          <MetricCard
            label="Zaległe"
            value={appointmentGroups.overdue.length}
            detail="Wymagają decyzji"
            tone="red"
          />
        </section>

        <DashboardCard className="p-4 sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <SegmentedControl value={viewMode} onChange={setViewMode} />
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold text-slate-500">
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-slate-950">{appointmentGroups.upcoming.length}</p>
                <p>Nadchodzące</p>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-slate-950">{appointmentGroups.overdue.length}</p>
                <p>Zaległe</p>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-slate-950">{appointmentGroups.history.length}</p>
                <p>Historia</p>
              </div>
            </div>
          </div>
        </DashboardCard>

        {appointmentGroups.current.length > 0 ? (
          <div className="space-y-5">
            {appointmentGroups.current.map((group) => (
              <section key={group.date} className="space-y-3">
                <p className="pl-1 text-sm font-bold text-slate-700">{group.label}</p>
                <div className="grid gap-4 xl:grid-cols-2">
                  {group.items.map(renderAppointmentCard)}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <DashboardCard className="p-6 text-sm font-medium text-slate-500">
            Brak wizyt w tej sekcji.
          </DashboardCard>
        )}
      </div>

      <AppointmentDetailsModal
        key={selectedAppointment ? `${selectedAppointment.id}:${modalMode}` : "appointments-test-modal"}
        appointments={displayedAppointments}
        selectedAppointment={selectedAppointment}
        clients={clients}
        services={services}
        initialMode={modalMode}
        onClose={() => {
          setSelectedAppointmentId(null);
          setModalMode("details");
        }}
        onCompleted={(appointmentId, state) =>
          setCompletedAppointmentStates((current) => ({
            ...current,
            [appointmentId]: state,
          }))
        }
        onToast={setToast}
      />
    </>
  );
}
