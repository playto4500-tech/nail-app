"use client";

import { useEffect, useMemo, useState } from "react";
import AppointmentDetailsModal from "./AppointmentDetailsModal";
import type { Appointment } from "../lib/data/appointments";
import type { ClientSummary } from "../lib/data/clients";
import type { ServiceItem } from "../lib/data/services";
import {
  formatPrice,
  formatSectionDate,
  getAppointmentPaidTotal,
  getDisplayStatus,
  getStatusClasses,
  getStatusLabel,
  getTodayDateKey,
  type DisplayAppointmentStatus,
  type AppointmentCompletionState,
  type ToastMessage,
} from "../lib/ui/appointments";

type Props = {
  appointments: Appointment[];
  clients: ClientSummary[];
  services: ServiceItem[];
};

function addDaysToDateKey(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T12:00:00`);
  date.setDate(date.getDate() + days);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getEndOfMonthDateKey(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00`);
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 12);

  const year = endOfMonth.getFullYear();
  const month = String(endOfMonth.getMonth() + 1).padStart(2, "0");
  const day = String(endOfMonth.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getEndOfWeekDateKey(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00`);
  const day = date.getDay();
  const daysUntilSunday = day === 0 ? 0 : 7 - day;

  return addDaysToDateKey(dateKey, daysUntilSunday);
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

function getDaysBetweenDateKeys(fromDateKey: string, toDateKey: string) {
  const fromDate = new Date(`${fromDateKey}T12:00:00`);
  const toDate = new Date(`${toDateKey}T12:00:00`);
  const dayInMs = 1000 * 60 * 60 * 24;

  return Math.max(0, Math.round((toDate.getTime() - fromDate.getTime()) / dayInMs));
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

export default function AppointmentsExperience({
  appointments,
  clients,
  services,
}: Props) {
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<null | number>(null);
  const [modalMode, setModalMode] = useState<"details" | "complete">("details");
  const [showPastVisits, setShowPastVisits] = useState(false);
  const [showLaterVisits, setShowLaterVisits] = useState(false);
  const [toast, setToast] = useState<null | ToastMessage>(null);
  const [completedAppointmentStates, setCompletedAppointmentStates] = useState<
    Record<number, AppointmentCompletionState>
  >({});

  const selectedAppointment = useMemo(
    () =>
      appointments.find((appointment) => appointment.id === selectedAppointmentId) ?? null,
    [appointments, selectedAppointmentId],
  );
  const todayDateKey = useMemo(() => getTodayDateKey(), []);
  const twoWeeksEndDateKey = useMemo(
    () => addDaysToDateKey(todayDateKey, 13),
    [todayDateKey],
  );
  const weekEndDateKey = useMemo(
    () => getEndOfWeekDateKey(todayDateKey),
    [todayDateKey],
  );
  const monthEndDateKey = useMemo(
    () => getEndOfMonthDateKey(todayDateKey),
    [todayDateKey],
  );
  const lastVisitDaysByClientKey = useMemo(() => {
    const lastCompletedDateByClientKey = new Map<string, string>();

    appointments.forEach((appointment) => {
      const isCompleted =
        appointment.status === "completed" ||
        completedAppointmentStates[appointment.id] !== undefined;

      if (!isCompleted || appointment.date > todayDateKey) {
        return;
      }

      const clientKey = appointment.clientId
        ? `id:${appointment.clientId}`
        : `name:${appointment.clientName.toLocaleLowerCase("pl-PL")}`;
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
  }, [appointments, completedAppointmentStates, todayDateKey]);

  const groupedAppointments = useMemo(() => {
    function isCompleted(appointment: Appointment) {
      return (
        appointment.status === "completed" ||
        completedAppointmentStates[appointment.id] !== undefined
      );
    }

    function compareAppointments(a: Appointment, b: Appointment) {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }

      return a.time.localeCompare(b.time);
    }

    const currentAppointments = appointments.filter(
      (appointment) => !isCompleted(appointment),
    );
    const past = appointments.filter((appointment) => isCompleted(appointment));
    const visibleCurrentAppointments = currentAppointments.filter(
      (appointment) =>
        appointment.date < todayDateKey || appointment.date <= twoWeeksEndDateKey,
    );
    const laterAppointments = currentAppointments.filter(
      (appointment) => appointment.date > twoWeeksEndDateKey,
    );
    const summaryAppointments = currentAppointments.filter(
      (appointment) => appointment.status !== "cancelled",
    );

    function groupByDate(items: Appointment[], direction: "asc" | "desc") {
      const sortedItems = [...items].sort((a, b) => {
        const result = compareAppointments(a, b);
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

    return {
      currentGroups: groupByDate(visibleCurrentAppointments, "asc"),
      laterGroups: groupByDate(laterAppointments, "asc"),
      pastGroups: groupByDate(past, "desc"),
      laterCount: laterAppointments.length,
      pastCount: past.length,
      stats: {
        today: summaryAppointments.filter(
          (appointment) => appointment.date === todayDateKey,
        ).length,
        week: summaryAppointments.filter(
          (appointment) =>
            appointment.date >= todayDateKey && appointment.date <= weekEndDateKey,
        ).length,
        month: summaryAppointments.filter(
          (appointment) =>
            appointment.date >= todayDateKey && appointment.date <= monthEndDateKey,
        ).length,
      },
    };
  }, [
    appointments,
    completedAppointmentStates,
    monthEndDateKey,
    todayDateKey,
    twoWeeksEndDateKey,
    weekEndDateKey,
  ]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  function renderAppointmentCard(appointment: Appointment) {
    const completedState = completedAppointmentStates[appointment.id] ?? null;
    const displayAppointment = getDisplayAppointment(appointment, completedState);
    const displayStatus = getDisplayStatus(displayAppointment) as DisplayAppointmentStatus;
    const canComplete = displayStatus !== "cancelled" && displayStatus !== "completed";
    const clientKey = displayAppointment.clientId
      ? `id:${displayAppointment.clientId}`
      : `name:${displayAppointment.clientName.toLocaleLowerCase("pl-PL")}`;
    const lastVisitDaysAgo = lastVisitDaysByClientKey.get(clientKey) ?? null;

    return (
      <article
        key={appointment.id}
        className="relative rounded-[24px] bg-white shadow-sm shadow-slate-200"
      >
        <button
          type="button"
          onClick={() => {
            setModalMode("details");
            setSelectedAppointmentId(appointment.id);
          }}
          className="block w-full rounded-[24px] px-5 pb-[3.25rem] pt-3.5 text-left transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-300"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">{displayAppointment.time}</p>
              <p className="mt-1.5 text-lg font-semibold text-slate-900">
                {displayAppointment.clientName}
              </p>
              {displayAppointment.clientInstagramHandle ? (
                <p className="mt-0.5 text-sm text-slate-500">
                  {displayAppointment.clientInstagramHandle}
                </p>
              ) : null}
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(displayStatus)}`}
            >
              {getStatusLabel(displayStatus)}
            </span>
          </div>

          <div className="mt-2.5 space-y-1.5 text-sm text-slate-600">
            {displayAppointment.serviceName ? (
              <p>
                Usługa:{" "}
                <span className="font-medium text-slate-900">
                  {displayAppointment.serviceName}
                </span>
              </p>
            ) : null}
            {displayAppointment.addonNames.length > 0 ? (
              <p>
                Dodatek:{" "}
                <span className="font-medium text-slate-900">
                  {displayAppointment.addonNames.join(", ")}
                </span>
              </p>
            ) : null}
            {displayStatus === "completed" ? (
              <p>
                Otrzymano:{" "}
                <span className="font-medium text-slate-900">
                  {formatPrice(
                    getAppointmentPaidTotal(
                      displayAppointment.price ?? 0,
                      displayAppointment.tip,
                    ),
                  )}
                </span>
              </p>
            ) : null}
          </div>
        </button>

        <p
          className={`absolute bottom-4 left-5 truncate text-xs font-medium text-slate-400 ${
            canComplete ? "right-16" : "right-5"
          }`}
        >
          {formatLastVisitLabel(lastVisitDaysAgo)}
        </p>

        {canComplete ? (
          <button
            type="button"
            onClick={() => {
              setModalMode("complete");
              setSelectedAppointmentId(appointment.id);
            }}
            className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-[14px] border border-emerald-200 bg-white text-emerald-700 transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            aria-label={`Zakończ wizytę: ${displayAppointment.clientName}`}
            title="Zakończ wizytę"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-[18px] w-[18px]"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.4"
            >
              <path d="m5 12 4 4L19 6" />
            </svg>
          </button>
        ) : null}
      </article>
    );
  }

  return (
    <>
      {toast ? (
        <div className="fixed left-1/2 top-[4.75rem] z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2">
          <div
            className={`rounded-2xl px-4 py-3 text-sm font-semibold shadow-lg ${
              toast.tone === "success"
                ? "bg-emerald-100 text-emerald-800 shadow-emerald-100"
                : "bg-rose-100 text-rose-800 shadow-rose-100"
            }`}
          >
            {toast.message}
          </div>
        </div>
      ) : null}

      <section className="space-y-4">
        <div className="rounded-[24px] bg-white p-5 shadow-sm shadow-slate-200">
          <p className="text-sm font-semibold text-slate-900">Nadchodzące wizyty</p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-slate-50 px-3 py-3">
              <p className="text-xs text-slate-500">Dzisiaj</p>
              <p className="mt-1 text-xl font-semibold text-slate-950">
                {groupedAppointments.stats.today}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-3 py-3">
              <p className="text-xs text-slate-500">Tydzień</p>
              <p className="mt-1 text-xl font-semibold text-slate-950">
                {groupedAppointments.stats.week}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-3 py-3">
              <p className="text-xs text-slate-500">Miesiąc</p>
              <p className="mt-1 text-xl font-semibold text-slate-950">
                {groupedAppointments.stats.month}
              </p>
            </div>
          </div>
        </div>

        {groupedAppointments.currentGroups.length > 0 ? (
          groupedAppointments.currentGroups.map((group) => (
            <section key={group.date} className="space-y-3">
              <p className="pl-1 text-sm font-semibold text-slate-700">{group.label}</p>
              <div className="space-y-3">{group.items.map(renderAppointmentCard)}</div>
            </section>
          ))
        ) : (
          <div className="rounded-[24px] border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm shadow-slate-200">
            {groupedAppointments.laterCount > 0
              ? "Brak wizyt w najbliższych 2 tygodniach."
              : "Nie ma jeszcze żadnych aktywnych wizyt."}
          </div>
        )}

        {groupedAppointments.laterCount > 0 ? (
          <section className="rounded-[24px] bg-white p-5 shadow-sm shadow-slate-200">
            <button
              type="button"
              onClick={() => setShowLaterVisits((current) => !current)}
              className="flex w-full items-center justify-between gap-3 text-left"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Późniejsze wizyty
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {groupedAppointments.laterCount} wizyt po najbliższych 2 tygodniach
                </p>
              </div>
              <span className="text-sm font-semibold text-slate-600">
                {showLaterVisits ? "Ukryj" : "Pokaż późniejsze wizyty"}
              </span>
            </button>

            {showLaterVisits ? (
              <div className="mt-5 space-y-5">
                {groupedAppointments.laterGroups.map((group) => (
                  <section key={group.date} className="space-y-3">
                    <p className="pl-1 text-sm font-semibold text-slate-700">{group.label}</p>
                    <div className="space-y-3">{group.items.map(renderAppointmentCard)}</div>
                  </section>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        {groupedAppointments.pastCount > 0 ? (
          <section className="rounded-[24px] bg-white p-5 shadow-sm shadow-slate-200">
            <button
              type="button"
              onClick={() => setShowPastVisits((current) => !current)}
              className="flex w-full items-center justify-between gap-3 text-left"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">Poprzednie wizyty</p>
                <p className="mt-1 text-sm text-slate-500">
                  {groupedAppointments.pastCount} zakończonych wizyt
                </p>
              </div>
              <span className="text-sm font-semibold text-slate-600">
                {showPastVisits ? "Ukryj" : "Pokaż"}
              </span>
            </button>

            {showPastVisits ? (
              <div className="mt-5 space-y-5">
                {groupedAppointments.pastGroups.map((group) => (
                  <section key={group.date} className="space-y-3">
                    <p className="pl-1 text-sm font-semibold text-slate-700">{group.label}</p>
                    <div className="space-y-3">{group.items.map(renderAppointmentCard)}</div>
                  </section>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}
      </section>

      <AppointmentDetailsModal
        key={selectedAppointment ? `${selectedAppointment.id}:${modalMode}` : "appointments-modal"}
        appointments={appointments}
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
        onCompletionSuccess={() => setShowPastVisits(true)}
        onToast={setToast}
      />
    </>
  );
}
