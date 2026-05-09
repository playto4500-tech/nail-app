"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createAppointmentAction } from "../app/actions/appointments";
import type { ClientSummary } from "../lib/data/clients";
import type { ServiceItem } from "../lib/data/services";

type Props = {
  clients: ClientSummary[];
  services: ServiceItem[];
};

function formatPrice(price: number) {
  return `${price} zł`;
}

export default function NewAppointmentForm({ clients, services }: Props) {
  const serviceOptions = services.filter((service) => service.category === "service");
  const addonOptions = services.filter((service) => service.category === "addon");
  const [isNewClient, setIsNewClient] = useState(clients.length === 0);
  const [includeAddons, setIncludeAddons] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedClientId, setSelectedClientId] = useState(
    clients[0] ? String(clients[0].id) : "",
  );
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);

  const selectedService = useMemo(
    () => serviceOptions.find((service) => String(service.id) === selectedServiceId),
    [serviceOptions, selectedServiceId],
  );

  const selectedClient = useMemo(
    () => clients.find((client) => String(client.id) === selectedClientId),
    [clients, selectedClientId],
  );

  const selectedAddons = useMemo(
    () =>
      addonOptions.filter((addon) => selectedAddonIds.includes(String(addon.id))),
    [addonOptions, selectedAddonIds],
  );

  const addonsPrice = selectedAddons.reduce((total, addon) => total + addon.price, 0);

  function handleAddonToggle(addonId: string, checked: boolean) {
    setSelectedAddonIds((current) => {
      if (checked) {
        return [...current, addonId];
      }

      return current.filter((id) => id !== addonId);
    });
  }

  return (
    <form
      action={createAppointmentAction}
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
              <p className="mt-1">
                Status:{" "}
                <span className="font-medium text-slate-900">
                  {selectedClient.status === "regular" ? "Stała klientka" : "Nowa klientka"}
                </span>
              </p>
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
        <span className="text-sm font-medium text-slate-700">Usługa</span>
        <select
          name="serviceId"
          required
          defaultValue=""
          disabled={serviceOptions.length === 0}
          onChange={(event) => setSelectedServiceId(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
        >
          <option value="" disabled>
            {serviceOptions.length === 0
              ? "Najpierw dodaj usługę w cenniku"
              : "Wybierz usługę"}
          </option>
          {serviceOptions.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">Cena z usługi</span>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900">
          {selectedService ? formatPrice(selectedService.price) : "Wybierz usługę"}
        </div>
      </label>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={includeAddons}
            disabled={addonOptions.length === 0}
            onChange={(event) => {
              const isChecked = event.target.checked;
              setIncludeAddons(isChecked);

              if (!isChecked) {
                setSelectedAddonIds([]);
              }
            }}
            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
          />
          <span className="text-sm font-medium text-slate-700">Dodatek</span>
        </label>

        {includeAddons ? (
          addonOptions.length > 0 ? (
            <div className="space-y-2">
              {addonOptions.map((addon) => {
                const isSelected = selectedAddonIds.includes(String(addon.id));

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
                          handleAddonToggle(String(addon.id), event.target.checked)
                        }
                        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                      />
                      <span className="min-w-0 text-sm font-medium text-slate-900">
                        {addon.name}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm text-slate-500">
                      +{formatPrice(addon.price)}
                    </span>
                  </label>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
              Nie ma jeszcze żadnych dodatków w cenniku.
            </div>
          )
        ) : null}
      </section>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">Suma</span>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900">
          {selectedService
            ? formatPrice(selectedService.price + addonsPrice)
            : "Wybierz usługę"}
        </div>
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">Status</span>
        <select
          name="status"
          defaultValue="scheduled"
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
          disabled={serviceOptions.length === 0 || (!isNewClient && clients.length === 0)}
          className="flex-1 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400"
        >
          Zapisz wizytę
        </button>
      </div>
    </form>
  );
}
