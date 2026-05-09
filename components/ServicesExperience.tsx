"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateServiceAction } from "../app/actions/services";
import type { ServiceItem } from "../lib/data/services";

type Props = {
  services: ServiceItem[];
};

type EditFormState = {
  id: number;
  category: "service" | "addon";
  name: string;
  price: string;
};

function formatPrice(price: number) {
  return `${price} zł`;
}

function getCategoryLabel(category: "service" | "addon") {
  return category === "service" ? "Usługa" : "Dodatek";
}

function createInitialState(service: ServiceItem): EditFormState {
  return {
    id: service.id,
    category: service.category,
    name: service.name,
    price: String(service.price),
  };
}

export default function ServicesExperience({ services }: Props) {
  const router = useRouter();
  const [selectedServiceId, setSelectedServiceId] = useState<null | number>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [editState, setEditState] = useState<null | EditFormState>(null);

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId) ?? null,
    [services, selectedServiceId],
  );

  useEffect(() => {
    if (!selectedService) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedService]);

  useEffect(() => {
    if (!selectedService) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedServiceId(null);
        setEditState(null);
        setIsEditing(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedService]);

  function resetModalState() {
    setSelectedServiceId(null);
    setEditState(null);
    setIsEditing(false);
  }

  function openModal(serviceId: number) {
    setSelectedServiceId(serviceId);
  }

  function closeModal() {
    if (isPending) {
      return;
    }

    resetModalState();
  }

  function openEditMode() {
    if (!selectedService) {
      return;
    }

    setEditState(createInitialState(selectedService));
    setIsEditing(true);
  }

  function closeEditMode() {
    if (!selectedService) {
      return;
    }

    setEditState(createInitialState(selectedService));
    setIsEditing(false);
  }

  async function submitEdit(formData: FormData) {
    if (!editState) {
      return;
    }

    formData.set("id", String(editState.id));
    formData.set("category", editState.category);

    startTransition(async () => {
      await updateServiceAction(formData);
      router.refresh();
      resetModalState();
    });
  }

  return (
    <>
      {services.map((service) => (
        <button
          key={service.id}
          type="button"
          onClick={() => openModal(service.id)}
          className="block w-full rounded-[20px] border border-slate-100 bg-slate-50 px-4 py-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">{service.name}</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {formatPrice(service.price)}
              </p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
              {getCategoryLabel(service.category)}
            </span>
          </div>
        </button>
      ))}

      {selectedService ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-4 backdrop-blur-[2px] sm:items-center">
          <div className="absolute inset-0" onClick={closeModal} aria-hidden="true" />
          <section className="relative z-10 w-full max-w-md rounded-[28px] bg-white p-6 shadow-xl shadow-slate-300">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                  Element cennika
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  {selectedService.name}
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
                  <span className="text-sm font-medium text-slate-700">Nazwa</span>
                  <input
                    name="name"
                    type="text"
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
                  <span className="text-sm font-medium text-slate-700">Cena</span>
                  <div className="flex items-center gap-3">
                    <input
                      name="price"
                      type="number"
                      min="1"
                      value={editState.price}
                      onChange={(event) =>
                        setEditState((current) =>
                          current ? { ...current, price: event.target.value } : current,
                        )
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                    />
                    <span className="shrink-0 text-sm font-semibold text-slate-500">PLN</span>
                  </div>
                </label>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Kategoria:{" "}
                  <span className="font-medium text-slate-900">
                    {getCategoryLabel(editState.category)}
                  </span>
                </div>

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
            ) : (
              <div className="mt-6 space-y-5">
                <div className="rounded-[24px] bg-slate-50 p-4 text-sm text-slate-600">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Kategoria</p>
                  <p className="mt-2 font-medium text-slate-900">
                    {getCategoryLabel(selectedService.category)}
                  </p>
                </div>

                <div className="rounded-[24px] bg-slate-50 p-4 text-sm text-slate-600">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Cena</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {formatPrice(selectedService.price)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openEditMode}
                  disabled={isPending}
                  className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400"
                >
                  Edytuj
                </button>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}
