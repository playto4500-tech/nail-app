"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteClientAction, updateClientAction } from "../app/actions/clients";
import { useBodyScrollLock } from "../lib/hooks/useBodyScrollLock";
import { useEscapeToClose } from "../lib/hooks/useEscapeToClose";
import { formatNumericDate, formatPrice } from "../lib/ui/format";
import { getTodayDateKey } from "../lib/utils/date";
import type { ClientItem, ClientVisit } from "../lib/data/clients";
import {
  getClientClassificationClasses,
  getClientClassificationLabel,
} from "../lib/ui/clients";

type Props = {
  clients: ClientItem[];
  visitsByClient: Record<number, ClientVisit[]>;
};

type EditFormState = {
  name: string;
  instagramHandle: string;
  status: ClientItem["status"];
  notes: string;
};

type ClientSortMode = "alphabetical" | "visitCount" | "oldestLastVisit";

function getStatusLabel(status: ClientVisit["status"]) {
  if (status === "completed") {
    return "Zakończona";
  }

  if (status === "cancelled") {
    return "Anulowana";
  }

  if (status === "confirmed") {
    return "Potwierdzona";
  }

  return "Zaplanowana";
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

function getLatestVisitDate(visits: ClientVisit[]) {
  return visits.reduce<null | string>((latestDate, visit) => {
    if (!latestDate || visit.date > latestDate) {
      return visit.date;
    }

    return latestDate;
  }, null);
}

export default function ClientsExperience({ clients, visitsByClient }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedClientId, setSelectedClientId] = useState<null | number>(null);
  const [editingClientId, setEditingClientId] = useState<null | number>(null);
  const [editState, setEditState] = useState<null | EditFormState>(null);
  const [actionError, setActionError] = useState("");
  const [deletedClientIds, setDeletedClientIds] = useState<number[]>([]);
  const [sortMode, setSortMode] = useState<ClientSortMode>("alphabetical");
  const todayDateKey = useMemo(() => getTodayDateKey(), []);
  const visibleClients = useMemo(
    () => clients.filter((client) => !deletedClientIds.includes(client.id)),
    [clients, deletedClientIds],
  );
  const sortedVisibleClients = useMemo(
    () =>
      [...visibleClients].sort((first, second) => {
        if (sortMode === "oldestLastVisit") {
          const firstLastVisitDate = getLatestVisitDate(
            visitsByClient[first.id] ?? [],
          );
          const secondLastVisitDate = getLatestVisitDate(
            visitsByClient[second.id] ?? [],
          );

          if (!firstLastVisitDate && !secondLastVisitDate) {
            return first.name.localeCompare(second.name, "pl");
          }

          if (!firstLastVisitDate) {
            return 1;
          }

          if (!secondLastVisitDate) {
            return -1;
          }

          const dateDifference =
            firstLastVisitDate.localeCompare(secondLastVisitDate);

          if (dateDifference !== 0) {
            return dateDifference;
          }
        }

        if (sortMode === "visitCount") {
          const countDifference =
            (visitsByClient[second.id]?.length ?? 0) -
            (visitsByClient[first.id]?.length ?? 0);

          if (countDifference !== 0) {
            return countDifference;
          }
        }

        return first.name.localeCompare(second.name, "pl");
      }),
    [sortMode, visibleClients, visitsByClient],
  );

  const selectedClient = useMemo(
    () => visibleClients.find((client) => client.id === selectedClientId) ?? null,
    [visibleClients, selectedClientId],
  );
  const editingClient = useMemo(
    () => visibleClients.find((client) => client.id === editingClientId) ?? null,
    [visibleClients, editingClientId],
  );
  const selectedClientVisits = selectedClient
    ? visitsByClient[selectedClient.id] ?? []
    : [];
  const hasOpenModal = Boolean(selectedClient || editingClient);

  function closeModals() {
    if (isPending) {
      return;
    }

    setSelectedClientId(null);
    setEditingClientId(null);
    setEditState(null);
    setActionError("");
  }

  useBodyScrollLock(hasOpenModal);
  useEscapeToClose({
    enabled: hasOpenModal,
    isBlocked: isPending,
    onClose: closeModals,
  });

  function openHistory(clientId: number) {
    setEditingClientId(null);
    setEditState(null);
    setActionError("");
    setSelectedClientId(clientId);
  }

  function openEdit(client: ClientItem) {
    setSelectedClientId(null);
    setActionError("");
    setEditingClientId(client.id);
    setEditState({
      name: client.name,
      instagramHandle: client.instagramHandle ?? "",
      status: client.status === "family" ? "family" : "new",
      notes: client.notes,
    });
  }

  async function submitEdit(formData: FormData) {
    if (!editingClient || !editState) {
      return;
    }

    formData.set("clientId", String(editingClient.id));

    startTransition(async () => {
      const result = await updateClientAction(formData);

      if (!result.ok) {
        setActionError(
          result.error ??
            "Nie udało się zapisać klientki. Sprawdź, czy SQL 006 jest odpalony.",
        );
        return;
      }

      setSelectedClientId(null);
      setEditingClientId(null);
      setEditState(null);
      setActionError("");
      router.refresh();
    });
  }

  function handleDeleteClient() {
    if (!editingClient) {
      return;
    }

    if (
      !window.confirm(
        "Na pewno usunąć klientkę? Wizyty zostaną w pamięci aplikacji.",
      )
    ) {
      return;
    }

    const formData = new FormData();
    formData.set("clientId", String(editingClient.id));

    startTransition(async () => {
      const result = await deleteClientAction(formData);

      if (!result.ok) {
        setActionError(
          result.error ??
            "Nie udało się usunąć klientki. Sprawdź, czy SQL 006 jest odpalony.",
        );
        return;
      }

      setDeletedClientIds((current) =>
        current.includes(editingClient.id)
          ? current
          : [...current, editingClient.id],
      );
      setSelectedClientId(null);
      setEditingClientId(null);
      setEditState(null);
      setActionError("");
      router.refresh();
    });
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-2 rounded-[24px] border border-slate-200 bg-white p-1 shadow-sm shadow-slate-200">
        <button
          type="button"
          onClick={() => setSortMode("alphabetical")}
          className={`flex items-center justify-center rounded-[18px] px-2 py-3 text-center text-sm font-semibold transition ${
            sortMode === "alphabetical"
              ? "bg-slate-950 text-white"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          Alfabetycznie
        </button>
        <button
          type="button"
          onClick={() => setSortMode("visitCount")}
          className={`flex items-center justify-center rounded-[18px] px-2 py-3 text-center text-sm font-semibold transition ${
            sortMode === "visitCount"
              ? "bg-slate-950 text-white"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          Liczba wizyt
        </button>
        <button
          type="button"
          onClick={() => setSortMode("oldestLastVisit")}
          className={`flex items-center justify-center rounded-[18px] px-2 py-3 text-center text-sm font-semibold transition ${
            sortMode === "oldestLastVisit"
              ? "bg-slate-950 text-white"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          Najdawniej
        </button>
      </div>

      {sortedVisibleClients.map((client) => {
        const clientVisits = visitsByClient[client.id] ?? [];
        const visitCount = clientVisits.length;
        const lastVisitDate = getLatestVisitDate(clientVisits);
        const lastVisitDaysAgo = lastVisitDate
          ? getDaysBetweenDateKeys(lastVisitDate, todayDateKey)
          : null;

        return (
          <article
            key={client.id}
            className="relative rounded-[24px] bg-white shadow-sm shadow-slate-200"
          >
            <button
              type="button"
              onClick={() => openHistory(client.id)}
              className="block w-full rounded-[24px] p-4 pr-16 text-left transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{client.name}</p>
                  {client.instagramHandle ? (
                    <p className="mt-1 text-sm text-slate-500">
                      {client.instagramHandle}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-slate-400">
                      Brak Instagram handle
                    </p>
                  )}
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${getClientClassificationClasses(client.classification)}`}
                >
                  {getClientClassificationLabel(client.classification)}
                </span>
              </div>

              {client.notes ? (
                <p className="mt-3 text-sm text-slate-600">{client.notes}</p>
              ) : null}

              <p className="mt-3 text-sm font-medium text-slate-500">
                Poprzednie wizyty:{" "}
                <span className="text-slate-900">{visitCount}</span>
              </p>
              <p className="mt-2 text-xs font-medium text-slate-400">
                {formatLastVisitLabel(lastVisitDaysAgo)}
              </p>
            </button>

            <button
              type="button"
              onClick={() => openEdit(client)}
              className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-[14px] border border-slate-200 bg-white text-slate-600 shadow-sm shadow-slate-100 transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
              aria-label={`Edytuj klientkę: ${client.name}`}
              title="Edytuj klientkę"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </button>
          </article>
        );
      })}

      {editingClient && editState ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-4 backdrop-blur-[2px] sm:items-center">
          <div className="absolute inset-0" onClick={closeModals} aria-hidden="true" />
          <section className="relative z-10 max-h-[85vh] w-full max-w-md overflow-y-auto rounded-[28px] bg-white p-6 shadow-xl shadow-slate-300">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                  Edycja klientki
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  {editingClient.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeModals}
                disabled={isPending}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                aria-label="Zamknij edycję klientki"
              >
                ✕
              </button>
            </div>

            <form action={submitEdit} className="mt-6 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Imię</span>
                <input
                  name="name"
                  type="text"
                  required
                  value={editState.name}
                  onChange={(event) =>
                    setEditState((current) =>
                      current ? { ...current, name: event.target.value } : current,
                    )
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Instagram</span>
                <input
                  name="instagramHandle"
                  type="text"
                  value={editState.instagramHandle}
                  onChange={(event) =>
                    setEditState((current) =>
                      current
                        ? { ...current, instagramHandle: event.target.value }
                        : current,
                    )
                  }
                  placeholder="@nazwa albo puste"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                />
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <input
                  type="checkbox"
                  name="clientType"
                  value="family"
                  checked={editState.status === "family"}
                  onChange={(event) =>
                    setEditState((current) =>
                      current
                        ? {
                            ...current,
                            status: event.target.checked ? "family" : "new",
                          }
                        : current,
                    )
                  }
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                />
                <span className="text-sm font-medium text-slate-700">Rodzina</span>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Notatki</span>
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

              <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Usunięcie klientki nie usuwa jej wizyt. Wizyty zostaną w historii z
                zapisaną nazwą i szczegółami.
              </div>

              {actionError ? (
                <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {actionError}
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModals}
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
                  {isPending ? "Zapisywanie..." : "Zapisz"}
                </button>
              </div>

              <button
                type="button"
                onClick={handleDeleteClient}
                disabled={isPending}
                className="w-full rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
              >
                Usuń klientkę
              </button>
            </form>
          </section>
        </div>
      ) : null}

      {selectedClient ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-4 backdrop-blur-[2px] sm:items-center">
          <div
            className="absolute inset-0"
            onClick={closeModals}
            aria-hidden="true"
          />
          <section className="relative z-10 max-h-[85vh] w-full max-w-md overflow-y-auto rounded-[28px] bg-white p-6 shadow-xl shadow-slate-300">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                  Historia klientki
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  {selectedClient.name}
                </h2>
                {selectedClient.instagramHandle ? (
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedClient.instagramHandle}
                  </p>
                ) : (
                  null
                )}
              </div>
              <button
                type="button"
                onClick={closeModals}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100"
                aria-label="Zamknij historię klientki"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {selectedClientVisits.length > 0 ? (
                selectedClientVisits.map((visit) => (
                  <article
                    key={visit.id}
                    className="rounded-[22px] border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatNumericDate(visit.date)} · {visit.time}
                        </p>
                        {visit.serviceName ? (
                          <p className="mt-1 text-sm text-slate-600">{visit.serviceName}</p>
                        ) : null}
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                        {getStatusLabel(visit.status)}
                      </span>
                    </div>

                    {visit.status === "completed" ? (
                      <div className="mt-3">
                        <p className="text-sm font-semibold text-slate-900">
                          {formatPrice((visit.price ?? 0) + (visit.tip ?? 0))}
                        </p>
                        {visit.tip ? (
                          <p className="mt-1 text-xs text-slate-500">
                            W tym tip: {formatPrice(visit.tip)}
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    {visit.notes ? (
                      <p className="mt-3 text-sm text-slate-600">{visit.notes}</p>
                    ) : null}
                  </article>
                ))
              ) : (
                <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  Ta klientka nie ma jeszcze poprzednich wizyt.
                </div>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
