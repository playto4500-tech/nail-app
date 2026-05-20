"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  cancelAppointmentAction,
  completeAppointmentAction,
  deleteAppointmentAction,
  updateAppointmentAction,
} from "../app/actions/appointments";
import type { Appointment } from "../lib/data/appointments";
import type { ClientSummary } from "../lib/data/clients";
import type { ServiceItem } from "../lib/data/services";

type Props = {
  appointments: Appointment[];
  clients: ClientSummary[];
  services: ServiceItem[];
};

type EditFormState = {
  clientId: string;
  date: string;
  time: string;
  serviceId: string;
  includeAddons: boolean;
  addonIds: string[];
  status: "confirmed" | "scheduled";
  notes: string;
};

type AppointmentStatus = Appointment["status"];

function formatAppointmentDate(date: string) {
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(`${date}T12:00:00`));
}

function formatSectionDate(date: string) {
  const formatted = new Intl.DateTimeFormat("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${date}T12:00:00`));

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatPrice(price: number) {
  return `${price} zł`;
}

function getAppointmentTotal(price: number, addons: Array<{ price: number }>) {
  return price + addons.reduce((total, addon) => total + addon.price, 0);
}

function getStatusLabel(status: AppointmentStatus) {
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

function getStatusClasses(status: AppointmentStatus) {
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

function createInitialEditState(appointment: Appointment): EditFormState {
  return {
    clientId: String(appointment.clientId),
    date: appointment.date,
    time: appointment.time,
    serviceId: String(appointment.serviceId),
    includeAddons: appointment.addons.length > 0,
    addonIds: appointment.addons.map((addon) => String(addon.serviceId)),
    status: appointment.status === "confirmed" ? "confirmed" : "scheduled",
    notes: appointment.notes,
  };
}

function getTodayDateKey() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function AppointmentsExperience({
  appointments,
  clients,
  services,
}: Props) {
  const router = useRouter();
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<null | number>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [editState, setEditState] = useState<null | EditFormState>(null);
  const [showPastVisits, setShowPastVisits] = useState(false);

  const selectedAppointment = useMemo(
    () =>
      appointments.find((appointment) => appointment.id === selectedAppointmentId) ?? null,
    [appointments, selectedAppointmentId],
  );

  const serviceOptions = useMemo(
    () => services.filter((service) => service.category === "service"),
    [services],
  );
  const addonOptions = useMemo(
    () => services.filter((service) => service.category === "addon"),
    [services],
  );

  const selectedAppointmentSuggestedPrice = selectedAppointment
    ? getAppointmentTotal(selectedAppointment.price, selectedAppointment.addons)
    : 0;

  const todayDateKey = useMemo(() => getTodayDateKey(), []);

  const groupedAppointments = useMemo(() => {
    const upcoming = appointments.filter(
      (appointment) =>
        appointment.status !== "completed" && appointment.date >= todayDateKey,
    );
    const past = appointments.filter(
      (appointment) =>
        appointment.status === "completed" || appointment.date < todayDateKey,
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
  }, [appointments, todayDateKey]);

  useEffect(() => {
    if (!selectedAppointment) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedAppointment]);

  useEffect(() => {
    if (!selectedAppointment) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedAppointmentId(null);
        setEditState(null);
        setIsEditing(false);
        setIsCompleting(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedAppointment]);

  function openModal(appointmentId: number) {
    setSelectedAppointmentId(appointmentId);
  }

  function resetModalState() {
    setSelectedAppointmentId(null);
    setEditState(null);
    setIsEditing(false);
    setIsCompleting(false);
  }

  function closeModal() {
    if (isPending) {
      return;
    }

    resetModalState();
  }

  function openEditMode() {
    if (!selectedAppointment) {
      return;
    }

    setEditState(createInitialEditState(selectedAppointment));
    setIsEditing(true);
    setIsCompleting(false);
  }

  function closeEditMode() {
    if (!selectedAppointment) {
      return;
    }

    setEditState(createInitialEditState(selectedAppointment));
    setIsEditing(false);
  }

  function openCompleteMode() {
    if (
      !selectedAppointment ||
      selectedAppointment.status === "cancelled" ||
      selectedAppointment.status === "completed"
    ) {
      return;
    }

    setEditState(null);
    setIsEditing(false);
    setIsCompleting(true);
  }

  function closeCompleteMode() {
    setIsCompleting(false);
  }

  function handleAddonToggle(addonId: string, checked: boolean) {
    setEditState((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        addonIds: checked
          ? [...current.addonIds, addonId]
          : current.addonIds.filter((id) => id !== addonId),
      };
    });
  }

  async function submitEdit(formData: FormData) {
    if (!selectedAppointment || !editState) {
      return;
    }

    formData.set("appointmentId", String(selectedAppointment.id));

    startTransition(async () => {
      await updateAppointmentAction(formData);
      router.refresh();
      resetModalState();
    });
  }

  async function submitComplete(formData: FormData) {
    if (!selectedAppointment) {
      return;
    }

    formData.set("appointmentId", String(selectedAppointment.id));

    startTransition(async () => {
      await completeAppointmentAction(formData);
      router.refresh();
      resetModalState();
      setShowPastVisits(true);
    });
  }

  function handleCancelAppointment() {
    if (!selectedAppointment || selectedAppointment.status === "cancelled") {
      return;
    }

    if (!window.confirm("Na pewno oznaczyć tę wizytę jako anulowaną?")) {
      return;
    }

    const formData = new FormData();
    formData.set("appointmentId", String(selectedAppointment.id));

    startTransition(async () => {
      await cancelAppointmentAction(formData);
      router.refresh();
      resetModalState();
    });
  }

  function handleDeleteAppointment() {
    if (!selectedAppointment) {
      return;
    }

    if (!window.confirm("Na pewno usunąć tę wizytę? Tej operacji nie cofniemy.")) {
      return;
    }

    const formData = new FormData();
    formData.set("appointmentId", String(selectedAppointment.id));

    startTransition(async () => {
      await deleteAppointmentAction(formData);
      router.refresh();
      resetModalState();
    });
  }

  function renderAppointmentCard(appointment: Appointment) {
    return (
      <button
        key={appointment.id}
        type="button"
        onClick={() => openModal(appointment.id)}
        className="block w-full rounded-[24px] bg-white p-5 text-left shadow-sm shadow-slate-200 transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-300"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">{appointment.time}</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {appointment.clientName}
            </p>
            {appointment.clientInstagramHandle ? (
              <p className="mt-1 text-sm text-slate-500">
                {appointment.clientInstagramHandle}
              </p>
            ) : null}
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(appointment.status)}`}
          >
            {getStatusLabel(appointment.status)}
          </span>
        </div>

        <div className="mt-4 space-y-2 text-sm text-slate-600">
          <p>
            Usługa:{" "}
            <span className="font-medium text-slate-900">{appointment.serviceName}</span>
          </p>
          {appointment.status === "completed" ? (
            <p>
              Otrzymano:{" "}
              <span className="font-medium text-slate-900">
                {formatPrice(appointment.price)}
              </span>
            </p>
          ) : null}
          <p>
            Status klientki:{" "}
            <span className="font-medium text-slate-900">
              {appointment.clientStatus === "regular" ? "Stała klientka" : "Nowa klientka"}
            </span>
          </p>
        </div>
      </button>
    );
  }

  return (
    <>
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

      {selectedAppointment ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-4 backdrop-blur-[2px] sm:items-center">
          <div className="absolute inset-0" onClick={closeModal} aria-hidden="true" />
          <section className="relative z-10 max-h-[85vh] w-full max-w-md overflow-y-auto rounded-[28px] bg-white p-6 shadow-xl shadow-slate-300">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                  Szczegóły wizyty
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  {selectedAppointment.clientName}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={isPending}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                aria-label="Zamknij okno"
              >
                ✕
              </button>
            </div>

            {isEditing && editState ? (
              <form action={submitEdit} className="mt-6 space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">Klientka</span>
                  <select
                    name="clientId"
                    value={editState.clientId}
                    onChange={(event) =>
                      setEditState((current) =>
                        current ? { ...current, clientId: event.target.value } : current,
                      )
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  >
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-1 gap-3 min-[440px]:grid-cols-2">
                  <label className="block min-w-0 space-y-2">
                    <span className="text-sm font-medium text-slate-700">Data</span>
                    <input
                      name="date"
                      type="date"
                      required
                      value={editState.date}
                      onChange={(event) =>
                        setEditState((current) =>
                          current ? { ...current, date: event.target.value } : current,
                        )
                      }
                      className="w-full min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] text-slate-900 outline-none transition focus:border-slate-400"
                    />
                  </label>

                  <label className="block min-w-0 space-y-2">
                    <span className="text-sm font-medium text-slate-700">Godzina</span>
                    <input
                      name="time"
                      type="time"
                      required
                      value={editState.time}
                      onChange={(event) =>
                        setEditState((current) =>
                          current ? { ...current, time: event.target.value } : current,
                        )
                      }
                      className="w-full min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] text-slate-900 outline-none transition focus:border-slate-400"
                    />
                  </label>
                </div>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">Usługa</span>
                  <select
                    name="serviceId"
                    value={editState.serviceId}
                    onChange={(event) =>
                      setEditState((current) =>
                        current ? { ...current, serviceId: event.target.value } : current,
                      )
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  >
                    {serviceOptions.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </label>

                <section className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={editState.includeAddons}
                      disabled={addonOptions.length === 0}
                      onChange={(event) =>
                        setEditState((current) =>
                          current
                            ? {
                                ...current,
                                includeAddons: event.target.checked,
                                addonIds: event.target.checked ? current.addonIds : [],
                              }
                            : current,
                        )
                      }
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                    />
                    <span className="text-sm font-medium text-slate-700">Dodatki</span>
                  </label>

                  {editState.includeAddons ? (
                    <div className="space-y-2">
                      {addonOptions.map((addon) => {
                        const isSelected = editState.addonIds.includes(String(addon.id));

                        return (
                          <label
                            key={addon.id}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
                          >
                            <span className="flex items-center gap-3 min-w-0">
                              <input
                                name="addonIds"
                                type="checkbox"
                                value={addon.id}
                                checked={isSelected}
                                onChange={(event) =>
                                  handleAddonToggle(
                                    String(addon.id),
                                    event.target.checked,
                                  )
                                }
                                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                              />
                              <span className="min-w-0 text-sm font-medium text-slate-900">
                                {addon.name}
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  ) : null}
                </section>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">Status</span>
                  <select
                    name="status"
                    value={editState.status}
                    onChange={(event) =>
                      setEditState((current) =>
                        current
                          ? {
                              ...current,
                              status: event.target.value as "confirmed" | "scheduled",
                            }
                          : current,
                      )
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  >
                    <option value="confirmed">Potwierdzona</option>
                    <option value="scheduled">Zaplanowana</option>
                  </select>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">Uwagi do wizyty</span>
                  <textarea
                    name="notes"
                    rows={4}
                    value={editState.notes}
                    onChange={(event) =>
                      setEditState((current) =>
                        current ? { ...current, notes: event.target.value } : current,
                      )
                    }
                    placeholder="(opcjonalne)"
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeEditMode}
                    disabled={isPending}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Wróć
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400"
                  >
                    {isPending ? "Zapisywanie..." : "Zapisz zmiany"}
                  </button>
                </div>
              </form>
            ) : isCompleting ? (
              <form action={submitComplete} className="mt-6 space-y-4">
                <div className="rounded-[24px] bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Sugerowana kwota
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {formatPrice(selectedAppointmentSuggestedPrice)}
                  </p>
                </div>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Ile klientka zapłaciła?
                  </span>
                  <div className="flex items-center gap-3">
                    <input
                      name="price"
                      type="number"
                      min="1"
                      step="1"
                      required
                      defaultValue={selectedAppointmentSuggestedPrice}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                    />
                    <span className="shrink-0 text-sm font-semibold text-slate-500">PLN</span>
                  </div>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Uwagi po wizycie
                  </span>
                  <textarea
                    name="notes"
                    rows={4}
                    defaultValue={selectedAppointment.notes}
                    placeholder="(opcjonalne)"
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeCompleteMode}
                    disabled={isPending}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Wróć
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400"
                  >
                    {isPending ? "Zapisywanie..." : "Zakończ"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-6 space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(selectedAppointment.status)}`}
                  >
                    {getStatusLabel(selectedAppointment.status)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {selectedAppointment.clientStatus === "regular"
                      ? "Stała klientka"
                      : "Nowa klientka"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-[24px] bg-slate-50 p-4 text-sm text-slate-600">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Data</p>
                    <p className="mt-2 font-medium text-slate-900">
                      {formatAppointmentDate(selectedAppointment.date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      Godzina
                    </p>
                    <p className="mt-2 font-medium text-slate-900">{selectedAppointment.time}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      Usługa
                    </p>
                    <p className="mt-2 font-medium text-slate-900">
                      {selectedAppointment.serviceName}
                    </p>
                  </div>
                  {selectedAppointment.clientInstagramHandle ? (
                    <div className="col-span-2">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                        Instagram
                      </p>
                      <p className="mt-2 font-medium text-slate-900">
                        {selectedAppointment.clientInstagramHandle}
                      </p>
                    </div>
                  ) : null}
                  {selectedAppointment.addons.length > 0 ? (
                    <div className="col-span-2">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                        Dodatki
                      </p>
                      <p className="mt-2 font-medium text-slate-900">
                        {selectedAppointment.addons
                          .map((addon) => addon.name)
                          .join(", ")}
                      </p>
                    </div>
                  ) : null}
                  {selectedAppointment.status === "completed" ? (
                    <div className="col-span-2">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                        Otrzymano
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">
                        {formatPrice(selectedAppointment.price)}
                      </p>
                    </div>
                  ) : null}
                </div>

                {selectedAppointment.notes ? (
                  <div className="rounded-[24px] bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      Uwagi
                    </p>
                    <p className="mt-2 text-sm text-slate-700">{selectedAppointment.notes}</p>
                  </div>
                ) : null}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {selectedAppointment.status === "completed" ? null : (
                    <>
                      {selectedAppointment.status === "cancelled" ? null : (
                        <button
                          type="button"
                          onClick={openCompleteMode}
                          disabled={isPending}
                          className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400"
                        >
                          Zakończ
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={openEditMode}
                        disabled={isPending}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        Edytuj
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelAppointment}
                        disabled={isPending || selectedAppointment.status === "cancelled"}
                        className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                      >
                        Anuluj
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={handleDeleteAppointment}
                    disabled={isPending}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Usuń
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}
