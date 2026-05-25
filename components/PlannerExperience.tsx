"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppointmentDetailsModal from "./AppointmentDetailsModal";
import type { Appointment } from "../lib/data/appointments";
import type { ClientSummary } from "../lib/data/clients";
import type { ServiceItem } from "../lib/data/services";
import {
  addDays,
  addMonths,
  buildMonthGrid,
  buildWeekDays,
  formatMonthLabel,
  formatWeekRangeLabel,
  getSuggestedTimeSlots,
  getWeekdayLabels,
  parseDateKey,
  startOfWeek,
  toDateKey,
  type PlannerView,
} from "../lib/planner/calendar";
import {
  formatLongDate,
  getStatusClasses,
  getStatusLabel,
  getTodayDateKey,
  type AppointmentCompletionState,
  type ToastMessage,
} from "../lib/ui/appointments";

type Props = {
  appointments: Appointment[];
  clients: ClientSummary[];
  services: ServiceItem[];
};

function getAppointmentCountBadgeClasses(count: number, isSelected: boolean) {
  if (count === 0) {
    return isSelected ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-500";
  }

  if (count >= 4) {
    return isSelected ? "bg-rose-500 text-white" : "bg-rose-100 text-rose-700";
  }

  if (count === 3) {
    return isSelected ? "bg-orange-500 text-white" : "bg-orange-100 text-orange-700";
  }

  if (count === 2) {
    return isSelected ? "bg-amber-500 text-white" : "bg-amber-100 text-amber-700";
  }

  return isSelected ? "bg-emerald-500 text-white" : "bg-emerald-100 text-emerald-700";
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

export default function PlannerExperience({ appointments, clients, services }: Props) {
  const todayDateKey = useMemo(() => getTodayDateKey(), []);
  const [view, setView] = useState<PlannerView>("month");
  const [selectedDateKey, setSelectedDateKey] = useState(todayDateKey);
  const [anchorDate, setAnchorDate] = useState(() => parseDateKey(todayDateKey));
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<null | number>(null);
  const [toast, setToast] = useState<null | ToastMessage>(null);
  const [completedAppointmentStates, setCompletedAppointmentStates] = useState<
    Record<number, AppointmentCompletionState>
  >({});

  const selectedAppointment = useMemo(
    () =>
      appointments.find((appointment) => appointment.id === selectedAppointmentId) ?? null,
    [appointments, selectedAppointmentId],
  );

  const displayAppointments = useMemo(
    () =>
      appointments.map((appointment) =>
        getDisplayAppointment(
          appointment,
          completedAppointmentStates[appointment.id] ?? null,
        ),
      ),
    [appointments, completedAppointmentStates],
  );

  const appointmentsByDate = useMemo(
    () =>
      displayAppointments.reduce<Record<string, Appointment[]>>((groups, appointment) => {
        const currentGroup = groups[appointment.date] ?? [];
        groups[appointment.date] = [...currentGroup, appointment];
        return groups;
      }, {}),
    [displayAppointments],
  );

  const selectedDateAppointments = useMemo(
    () =>
      (appointmentsByDate[selectedDateKey] ?? []).slice().sort((first, second) =>
        first.time.localeCompare(second.time),
      ),
    [appointmentsByDate, selectedDateKey],
  );

  const suggestedTimes = useMemo(
    () => getSuggestedTimeSlots(selectedDateKey, selectedDateAppointments),
    [selectedDateAppointments, selectedDateKey],
  );

  const monthGrid = useMemo(
    () => buildMonthGrid(anchorDate, todayDateKey),
    [anchorDate, todayDateKey],
  );
  const weekDays = useMemo(
    () => buildWeekDays(anchorDate, todayDateKey),
    [anchorDate, todayDateKey],
  );
  const weekdayLabels = useMemo(() => getWeekdayLabels(), []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  function moveBackward() {
    if (view === "month") {
      const nextAnchor = addMonths(anchorDate, -1);
      setAnchorDate(nextAnchor);
      setSelectedDateKey(toDateKey(nextAnchor));
      return;
    }

    const nextAnchor = addDays(startOfWeek(anchorDate), -7);
    setAnchorDate(nextAnchor);
    setSelectedDateKey(toDateKey(nextAnchor));
  }

  function moveForward() {
    if (view === "month") {
      const nextAnchor = addMonths(anchorDate, 1);
      setAnchorDate(nextAnchor);
      setSelectedDateKey(toDateKey(nextAnchor));
      return;
    }

    const nextAnchor = addDays(startOfWeek(anchorDate), 7);
    setAnchorDate(nextAnchor);
    setSelectedDateKey(toDateKey(nextAnchor));
  }

  function handleDaySelect(dateKey: string) {
    setSelectedDateKey(dateKey);
    setAnchorDate(parseDateKey(dateKey));
  }

  const addAppointmentHref = `/appointments/new?date=${selectedDateKey}`;

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

      <section className="space-y-5">
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={moveBackward}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm shadow-slate-200 transition hover:bg-slate-50"
              aria-label="Poprzedni zakres"
            >
              ←
            </button>

            <div className="min-w-0 flex-1 text-center">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
                Planner
              </p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {view === "month"
                  ? formatMonthLabel(anchorDate)
                  : formatWeekRangeLabel(anchorDate)}
              </p>
            </div>

            <button
              type="button"
              onClick={moveForward}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm shadow-slate-200 transition hover:bg-slate-50"
              aria-label="Następny zakres"
            >
              →
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-[24px] border border-slate-200 bg-white p-1 shadow-sm shadow-slate-200">
            <button
              type="button"
              onClick={() => setView("month")}
              className={`rounded-[18px] px-4 py-3 text-sm font-semibold transition ${
                view === "month"
                  ? "bg-slate-950 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Miesiąc
            </button>
            <button
              type="button"
              onClick={() => setView("week")}
              className={`rounded-[18px] px-4 py-3 text-sm font-semibold transition ${
                view === "week"
                  ? "bg-slate-950 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Tydzień
            </button>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-7 gap-2 px-1">
              {weekdayLabels.map((label) => (
                <p
                  key={label}
                  className="text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500"
                >
                  {label}
                </p>
              ))}
            </div>

            {view === "month" ? (
              <div className="space-y-2">
                {monthGrid.map((week, weekIndex) => (
                  <div key={weekIndex} className="grid grid-cols-7 gap-2">
                    {week.map((day) => {
                      const dayAppointments = appointmentsByDate[day.dateKey] ?? [];
                      const isSelected = day.dateKey === selectedDateKey;

                      return (
                        <button
                          key={day.dateKey}
                          type="button"
                          onClick={() => handleDaySelect(day.dateKey)}
                          className={`relative min-h-[72px] rounded-[22px] border px-2 py-2 text-left transition ${
                            isSelected
                              ? "border-slate-900 bg-slate-900 text-white shadow-sm shadow-slate-300"
                              : day.inCurrentMonth
                                ? "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
                                : "border-slate-100 bg-white/70 text-slate-400 hover:bg-white"
                          }`}
                        >
                          <span
                            className={`absolute right-2 top-2 inline-flex min-h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${getAppointmentCountBadgeClasses(
                              dayAppointments.length,
                              isSelected,
                            )}`}
                          >
                            {dayAppointments.length}
                          </span>

                          <div className="flex h-full items-end">
                            <span
                              className={`text-sm font-semibold ${
                                day.isToday && !isSelected ? "text-emerald-700" : ""
                              }`}
                            >
                              {day.dayNumber}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day) => {
                  const dayAppointments = appointmentsByDate[day.dateKey] ?? [];
                  const isSelected = day.dateKey === selectedDateKey;

                  return (
                    <button
                      key={day.dateKey}
                      type="button"
                      onClick={() => handleDaySelect(day.dateKey)}
                      className={`rounded-[24px] border px-2 py-3 text-center transition ${
                        isSelected
                          ? "border-slate-900 bg-slate-900 text-white shadow-sm shadow-slate-300"
                          : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <p className="text-[10px] font-medium uppercase tracking-[0.08em]">
                        {
                          weekdayLabels[
                            day.date.getDay() === 0 ? 6 : day.date.getDay() - 1
                          ]
                        }
                      </p>
                      <p
                        className={`mt-1.5 text-lg font-semibold ${
                          day.isToday && !isSelected ? "text-emerald-700" : ""
                        }`}
                      >
                        {day.dayNumber}
                      </p>
                      <span
                        className={`mt-2 inline-flex min-h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${getAppointmentCountBadgeClasses(
                          dayAppointments.length,
                          isSelected,
                        )}`}
                      >
                        {dayAppointments.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[28px] bg-white p-5 shadow-sm shadow-slate-200">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {formatLongDate(selectedDateKey)}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {selectedDateAppointments.length > 0
                  ? `${selectedDateAppointments.length} wizyt w tym dniu`
                  : "Brak wizyt w wybranym dniu"}
              </p>
            </div>
          </div>

          {selectedDateAppointments.length > 0 ? (
            <div className="mt-4 space-y-2">
              {selectedDateAppointments.map((appointment) => (
                <button
                  key={appointment.id}
                  type="button"
                  onClick={() => setSelectedAppointmentId(appointment.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-[22px] border border-slate-100 bg-slate-50 px-4 py-3 text-left transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-slate-900">
                      {appointment.clientName}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">{appointment.time}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(appointment.status)}`}
                  >
                    {getStatusLabel(appointment.status)}
                  </span>
                </button>
              ))}

              <Link
                href={addAppointmentHref}
                scroll={false}
                className="flex w-full items-center justify-center gap-3 rounded-[22px] border border-slate-200 bg-white px-4 py-4 text-center transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-white">
                  +
                </span>
                <span className="text-sm font-semibold text-slate-900">Dodaj wizytę</span>
              </Link>
            </div>
          ) : (
            <Link
              href={addAppointmentHref}
              scroll={false}
              className="mt-4 flex w-full items-center justify-center gap-3 rounded-[22px] border border-slate-200 bg-white px-4 py-5 text-center transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-lg text-white">
                +
              </span>
              <span className="text-sm font-semibold text-slate-900">Dodaj wizytę</span>
            </Link>
          )}

          {selectedDateKey >= todayDateKey ? (
            <div className="mt-5 rounded-[22px] border border-slate-100 bg-slate-50 px-4 py-4">
              <p className="text-sm font-semibold text-slate-900">Sugerowane godziny</p>
              <p className="mt-1 text-sm text-slate-500">
                Podstawa pod wolne sloty na bazie zajętych godzin.
              </p>
              {suggestedTimes.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {suggestedTimes.map((time) => (
                    <span
                      key={time}
                      className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700"
                    >
                      {time}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">Brak wolnych slotów w tym dniu.</p>
              )}
            </div>
          ) : null}
        </section>
      </section>

      <AppointmentDetailsModal
        key={selectedAppointment ? `planner-${selectedAppointment.id}` : "planner-modal"}
        appointments={appointments}
        selectedAppointment={selectedAppointment}
        clients={clients}
        services={services}
        onClose={() => setSelectedAppointmentId(null)}
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
