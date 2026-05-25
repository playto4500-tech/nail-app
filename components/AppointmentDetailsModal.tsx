"use client";

import { useMemo, useState, useTransition } from "react";
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
import { useBodyScrollLock } from "../lib/hooks/useBodyScrollLock";
import { useEscapeToClose } from "../lib/hooks/useEscapeToClose";
import {
  getAppointmentConflictMessage,
  getAppointmentConflicts,
} from "../lib/ui/appointment-conflicts";
import {
  formatAppointmentDate,
  formatPrice,
  getAppointmentPaidTotal,
  getStatusClasses,
  getStatusLabel,
  type AppointmentCompletionState,
  type ToastMessage,
} from "../lib/ui/appointments";

type Props = {
  appointments: Appointment[];
  selectedAppointment: Appointment | null;
  clients: ClientSummary[];
  services: ServiceItem[];
  initialMode?: "details" | "complete";
  onClose: () => void;
  onCompleted?: (appointmentId: number, state: AppointmentCompletionState) => void;
  onCompletionSuccess?: () => void;
  onToast?: (toast: ToastMessage) => void;
};

type EditFormState = {
  clientId: string;
  date: string;
  time: string;
  status: "confirmed" | "scheduled";
  notes: string;
};

function createInitialEditState(appointment: Appointment): EditFormState {
  return {
    clientId: appointment.clientId ? String(appointment.clientId) : "",
    date: appointment.date,
    time: appointment.time,
    status: appointment.status === "confirmed" ? "confirmed" : "scheduled",
    notes: appointment.notes,
  };
}

export default function AppointmentDetailsModal({
  appointments,
  selectedAppointment,
  clients,
  services,
  initialMode = "details",
  onClose,
  onCompleted,
  onCompletionSuccess,
  onToast,
}: Props) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isCompleting, setIsCompleting] = useState(
    () =>
      initialMode === "complete" &&
      selectedAppointment !== null &&
      selectedAppointment.status !== "cancelled" &&
      selectedAppointment.status !== "completed",
  );
  const [completeHasTip, setCompleteHasTip] = useState(
    () => (selectedAppointment?.tip ?? 0) > 0,
  );
  const [completeHasAddon, setCompleteHasAddon] = useState(
    () => (selectedAppointment?.addonNames.length ?? 0) > 0,
  );
  const [isPending, startTransition] = useTransition();
  const [editState, setEditState] = useState<null | EditFormState>(
    () => (selectedAppointment ? createInitialEditState(selectedAppointment) : null),
  );

  const serviceOptions = useMemo(
    () => services.filter((service) => service.category === "service"),
    [services],
  );
  const addonOptions = useMemo(
    () => services.filter((service) => service.category === "addon"),
    [services],
  );

  useBodyScrollLock(Boolean(selectedAppointment));
  useEscapeToClose({
    enabled: Boolean(selectedAppointment),
    isBlocked: isPending,
    onClose,
  });

  if (!selectedAppointment) {
    return null;
  }

  const appointment = selectedAppointment;

  function closeModal() {
    if (isPending) {
      return;
    }

    onClose();
  }

  function openEditMode() {
    setEditState(createInitialEditState(appointment));
    setIsEditing(true);
    setIsCompleting(false);
  }

  function closeEditMode() {
    setEditState(createInitialEditState(appointment));
    setIsEditing(false);
  }

  function openCompleteMode() {
    if (appointment.status === "cancelled" || appointment.status === "completed") {
      return;
    }

    setEditState(null);
    setIsEditing(false);
    setIsCompleting(true);
    setCompleteHasTip((appointment.tip ?? 0) > 0);
    setCompleteHasAddon(appointment.addonNames.length > 0);
  }

  function closeCompleteMode() {
    setIsCompleting(false);
    setCompleteHasTip(false);
    setCompleteHasAddon(false);
  }

  async function submitEdit(formData: FormData) {
    if (!editState) {
      return;
    }

    const conflictMessage = getAppointmentConflictMessage(
      getAppointmentConflicts({
        appointments,
        date: editState.date,
        time: editState.time,
        excludeAppointmentId: appointment.id,
      }),
      "zapisać",
    );

    if (conflictMessage && !window.confirm(conflictMessage)) {
      return;
    }

    formData.set("appointmentId", String(appointment.id));

    startTransition(async () => {
      const result = await updateAppointmentAction(formData);

      if (!result.ok) {
        onToast?.({
          message: result.error ?? "Nie udało się zapisać wizyty.",
          tone: "error",
        });
        return;
      }

      router.refresh();
      onClose();
    });
  }

  async function submitComplete(formData: FormData) {
    const completedPrice = Number(formData.get("price") ?? 0);
    const completedTipValue = String(formData.get("tip") ?? "").trim();
    const completedTip = completedTipValue === "" ? 0 : Number(completedTipValue);
    const completedAddonId = Number(formData.get("addonId") ?? 0);
    const completedAddon =
      completedAddonId > 0
        ? addonOptions.find((addon) => addon.id === completedAddonId) ?? null
        : null;

    formData.set("appointmentId", String(appointment.id));

    startTransition(async () => {
      const result = await completeAppointmentAction(formData);

      if (!result.ok) {
        onToast?.({
          message: result.error ?? "Nie udało się zakończyć wizyty.",
          tone: "error",
        });
        return;
      }

      onCompleted?.(appointment.id, {
        price: completedPrice,
        tip: Number.isFinite(completedTip) ? completedTip : 0,
        addonNames: completedAddon ? [completedAddon.name] : [],
      });
      onCompletionSuccess?.();
      onToast?.({
        message: "Zakończono wizytę",
        tone: "success",
      });
      onClose();
      router.refresh();
    });
  }

  function handleCancelAppointment() {
    if (appointment.status === "cancelled") {
      return;
    }

    if (!window.confirm("Na pewno oznaczyć tę wizytę jako anulowaną?")) {
      return;
    }

    const formData = new FormData();
    formData.set("appointmentId", String(appointment.id));

    startTransition(async () => {
      const result = await cancelAppointmentAction(formData);

      if (!result.ok) {
        onToast?.({
          message: result.error ?? "Nie udało się anulować wizyty.",
          tone: "error",
        });
        return;
      }

      router.refresh();
      onClose();
    });
  }

  function handleDeleteAppointment() {
    if (!window.confirm("Na pewno usunąć tę wizytę? Tej operacji nie cofniemy.")) {
      return;
    }

    const formData = new FormData();
    formData.set("appointmentId", String(appointment.id));

    startTransition(async () => {
      const result = await deleteAppointmentAction(formData);

      if (!result.ok) {
        onToast?.({
          message: result.error ?? "Nie udało się usunąć wizyty.",
          tone: "error",
        });
        return;
      }

      router.refresh();
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-4 backdrop-blur-[2px] sm:items-center">
      <div className="absolute inset-0" onClick={closeModal} aria-hidden="true" />
      <section className="relative z-10 max-h-[85vh] w-full max-w-md overflow-y-auto rounded-[28px] bg-white p-6 shadow-xl shadow-slate-300">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
              Szczegóły wizyty
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              {appointment.clientName}
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
                required
                value={editState.clientId}
                onChange={(event) =>
                  setEditState((current) =>
                    current ? { ...current, clientId: event.target.value } : current,
                  )
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              >
                {editState.clientId ? null : (
                  <option value="" disabled>
                    Wybierz klientkę
                  </option>
                )}
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
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Wykonana usługa</span>
              <select
                name="serviceId"
                required
                defaultValue={selectedAppointment.serviceId ? String(selectedAppointment.serviceId) : ""}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              >
                <option value="" disabled>
                  Wybierz usługę
                </option>
                {serviceOptions.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </label>

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
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
                <span className="shrink-0 text-sm font-semibold text-slate-500">PLN</span>
              </div>
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <input
                type="checkbox"
                name="hasTip"
                value="true"
                checked={completeHasTip}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                onChange={(event) => setCompleteHasTip(event.target.checked)}
              />
              <span className="text-sm font-medium text-slate-700">Tip</span>
            </label>

            {completeHasTip ? (
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Kwota</span>
                <div className="flex items-center gap-3">
                  <input
                    name="tip"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={selectedAppointment.tip ?? ""}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  />
                  <span className="shrink-0 text-sm font-semibold text-slate-500">PLN</span>
                </div>
              </label>
            ) : null}

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <input
                type="checkbox"
                name="hasAddon"
                value="true"
                checked={completeHasAddon}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                onChange={(event) => setCompleteHasAddon(event.target.checked)}
              />
              <span className="text-sm font-medium text-slate-700">Dodatek</span>
            </label>

            {completeHasAddon ? (
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Wybierz dodatek</span>
                <select
                  name="addonId"
                  required
                  defaultValue=""
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                >
                  <option value="" disabled>
                    Wybierz dodatek
                  </option>
                  {addonOptions.map((addon) => (
                    <option key={addon.id} value={addon.id}>
                      {addon.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Uwagi po wizycie</span>
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
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-[24px] bg-slate-50 p-4 text-sm text-slate-600">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Data</p>
                <p className="mt-2 font-medium text-slate-900">
                  {formatAppointmentDate(selectedAppointment.date)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Godzina</p>
                <p className="mt-2 font-medium text-slate-900">{selectedAppointment.time}</p>
              </div>
              {selectedAppointment.serviceName ? (
                <div className="col-span-2">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Usługa</p>
                  <p className="mt-2 font-medium text-slate-900">
                    {selectedAppointment.serviceName}
                  </p>
                </div>
              ) : null}
              {selectedAppointment.addonNames.length > 0 ? (
                <div className="col-span-2">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Dodatek</p>
                  <p className="mt-2 font-medium text-slate-900">
                    {selectedAppointment.addonNames.join(", ")}
                  </p>
                </div>
              ) : null}
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
              {selectedAppointment.status === "completed" ? (
                <div className="col-span-2">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Otrzymano
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {formatPrice(
                      getAppointmentPaidTotal(
                        selectedAppointment.price ?? 0,
                        selectedAppointment.tip,
                      ),
                    )}
                  </p>
                  {selectedAppointment.tip ? (
                    <p className="mt-1 text-sm text-slate-500">
                      W tym tip: {formatPrice(selectedAppointment.tip)}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            {selectedAppointment.notes ? (
              <div className="rounded-[24px] bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Uwagi</p>
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
  );
}
