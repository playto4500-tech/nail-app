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
  getStatusClasses,
  getStatusLabel,
  getTodayDateKey,
  type AppointmentCompletionState,
  type AppointmentStatus,
  type ToastMessage,
} from "../lib/ui/appointments";

type Props = {
  appointments: Appointment[];
  clients: ClientSummary[];
  services: ServiceItem[];
};

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

export default function AppointmentsExperience({
  appointments,
  clients,
  services,
}: Props) {
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<null | number>(null);
  const [modalMode, setModalMode] = useState<"details" | "complete">("details");
  const [showPastVisits, setShowPastVisits] = useState(false);
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

  const groupedAppointments = useMemo(() => {
    function isCompleted(appointment: Appointment) {
      return (
        appointment.status === "completed" ||
        completedAppointmentStates[appointment.id] !== undefined
      );
    }

    const upcoming = appointments.filter(
      (appointment) => !isCompleted(appointment) && appointment.date >= todayDateKey,
    );
    const past = appointments.filter(
      (appointment) => isCompleted(appointment) || appointment.date < todayDateKey,
    );

    function groupByDate(items: Appointment[]) {
      const groups = new Map<string, Appointment[]>();

      items.forEach((appointment) => {
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
      upcomingGroups: groupByDate(upcoming),
      pastGroups: groupByDate(past),
      upcomingCount: upcoming.length,
      pastCount: past.length,
    };
  }, [appointments, completedAppointmentStates, todayDateKey]);

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
    const displayStatus = displayAppointment.status as AppointmentStatus;
    const canComplete = displayStatus !== "cancelled" && displayStatus !== "completed";

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
          className={`block w-full rounded-[24px] px-5 pt-4 text-left transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-300 ${
            canComplete ? "pb-14" : "pb-4"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">{displayAppointment.time}</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {displayAppointment.clientName}
              </p>
              {displayAppointment.clientInstagramHandle ? (
                <p className="mt-1 text-sm text-slate-500">
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

          <div className="mt-3 space-y-2 text-sm text-slate-600">
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
          <p className="text-sm text-slate-500">Nadchodzące wizyty</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {groupedAppointments.upcomingCount}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Pokazujemy tylko dni, które mają przypisane wizyty.
          </p>
        </div>

        {groupedAppointments.upcomingGroups.length > 0 ? (
          groupedAppointments.upcomingGroups.map((group) => (
            <section key={group.date} className="space-y-3">
              <p className="pl-1 text-sm font-semibold text-slate-700">{group.label}</p>
              <div className="space-y-3">{group.items.map(renderAppointmentCard)}</div>
            </section>
          ))
        ) : (
          <div className="rounded-[24px] border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm shadow-slate-200">
            Nie ma jeszcze żadnych nadchodzących wizyt.
          </div>
        )}

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
                  {groupedAppointments.pastCount} zakończonych albo wcześniejszych wizyt
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
