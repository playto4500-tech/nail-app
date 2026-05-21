"use client";

import Link from "next/link";
import { useRef } from "react";
import { useMemo, useState } from "react";
import { createAppointmentAction } from "../app/actions/appointments";
import type { Appointment } from "../lib/data/appointments";
import type { ClientSummary } from "../lib/data/clients";
import {
  getAppointmentConflictMessage,
  getAppointmentConflicts,
} from "../lib/ui/appointment-conflicts";

type Props = {
  appointments: Appointment[];
  clients: ClientSummary[];
};

export default function NewAppointmentForm({ appointments, clients }: Props) {
  const [isNewClient, setIsNewClient] = useState(clients.length === 0);
  const [selectedClientId, setSelectedClientId] = useState(
    clients[0] ? String(clients[0].id) : "",
  );
  const formRef = useRef<HTMLFormElement>(null);

  const selectedClient = useMemo(
    () => clients.find((client) => String(client.id) === selectedClientId),
    [clients, selectedClientId],
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const date = String(formData.get("date") ?? "");
    const time = String(formData.get("time") ?? "");

    if (!date || !time) {
      return;
    }

    const conflicts = getAppointmentConflicts({
      appointments,
      date,
      time,
    });
    const conflictMessage = getAppointmentConflictMessage(conflicts, "dodać");

    if (conflictMessage && !window.confirm(conflictMessage)) {
      event.preventDefault();
    }
  }

  return (
    <form
      ref={formRef}
      action={createAppointmentAction}
      onSubmit={handleSubmit}
      className="space-y-4 rounded-[28px] bg-white p-6 shadow-sm shadow-slate-200"
    >
      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <input
          name="isNewClient"
          type="checkbox"
          value="true"
          checked={isNewClient}
          onChange={(event) => setIsNewClient(event.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
        />
        <span className="text-sm font-medium text-slate-700">Nowa klientka</span>
      </label>

      {isNewClient ? (
        <>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Imię klientki</span>
            <input
              name="clientName"
              type="text"
              required={isNewClient}
              placeholder="Np. Anna Kowalska"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">
              Instagram handle <span className="font-normal text-slate-500">(opcjonalne)</span>
            </span>
            <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-slate-400">
              <span className="shrink-0 text-sm font-medium text-slate-500">@</span>
              <input
                name="instagramHandle"
                type="text"
                placeholder="annanails"
                className="w-full min-w-0 bg-transparent pl-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Uwagi o klientce</span>
            <textarea
              name="clientNotes"
              rows={3}
              placeholder="Np. pierwsza wizyta, delikatna płytka"
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
            />
          </label>
        </>
      ) : (
        <>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Klientka</span>
            <select
              name="clientId"
              required={!isNewClient}
              value={selectedClientId}
              onChange={(event) => setSelectedClientId(event.target.value)}
              disabled={clients.length === 0}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            >
              {clients.length === 0 ? (
                <option value="">Brak zapisanych klientek</option>
              ) : (
                clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))
              )}
            </select>
          </label>

          {selectedClient ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <p className="font-medium text-slate-900">{selectedClient.name}</p>
              {selectedClient.instagramHandle ? (
                <p className="mt-1">
                  Instagram:{" "}
                  <span className="font-medium text-slate-900">
                    {selectedClient.instagramHandle}
                  </span>
                </p>
              ) : null}
            </div>
          ) : null}
        </>
      )}

      <div className="grid grid-cols-1 gap-3 min-[440px]:grid-cols-2">
        <label className="block min-w-0 space-y-2">
          <span className="text-sm font-medium text-slate-700">Data</span>
          <input
            name="date"
            type="date"
            required
            className="w-full min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] text-slate-900 outline-none transition focus:border-slate-400"
          />
        </label>

        <label className="block min-w-0 space-y-2">
          <span className="text-sm font-medium text-slate-700">Godzina</span>
          <input
            name="time"
            type="time"
            required
            className="w-full min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] text-slate-900 outline-none transition focus:border-slate-400"
          />
        </label>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">Status</span>
        <select
          name="status"
          defaultValue="confirmed"
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
          placeholder="(opcjonalne)"
          className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
        />
      </label>

      <div className="flex gap-3 pt-2">
        <Link
          href="/appointments"
          className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Wróć
        </Link>

        <button
          type="submit"
          disabled={!isNewClient && clients.length === 0}
          className="flex-1 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400"
        >
          Zapisz wizytę
        </button>
      </div>
    </form>
  );
}
