"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  completeAppointment,
  createAppointment,
  deleteAppointmentRecord,
  type AppointmentStatus,
  updateAppointment,
  updateAppointmentStatus,
} from "../../lib/data/appointments";
import { createClientRecord, getClientById } from "../../lib/data/clients";
import { getServiceById } from "../../lib/data/services";

export async function createAppointmentAction(formData: FormData) {
  const isNewClient = String(formData.get("isNewClient") ?? "") === "true";
  const clientId = Number(formData.get("clientId") ?? 0);
  const clientName = String(formData.get("clientName") ?? "").trim();
  const instagramHandleValue = String(formData.get("instagramHandle") ?? "").trim();
  const instagramHandle = instagramHandleValue
    ? `@${instagramHandleValue.replace(/^@+/, "")}`
    : "";
  const clientNotes = String(formData.get("clientNotes") ?? "").trim();
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const status = String(formData.get("status") ?? "confirmed") as AppointmentStatus;
  const notes = String(formData.get("notes") ?? "").trim();

  if (!date || !time) {
    return;
  }

  let finalClientId = clientId;
  let finalClientName = clientName;
  let finalInstagramHandle: null | string = instagramHandle || null;

  if (isNewClient) {
    if (!clientName) {
      return;
    }

    finalClientId = await createClientRecord({
      name: clientName,
      instagramHandle,
      status: "new",
      notes: clientNotes,
    });
  } else {
    const selectedClient = await getClientById(clientId);

    if (!selectedClient) {
      return;
    }

    finalClientName = selectedClient.name;
    finalInstagramHandle = selectedClient.instagramHandle;
  }

  if (!finalClientId || !finalClientName) {
    return;
  }

  await createAppointment({
    clientId: finalClientId,
    clientName: finalClientName,
    clientInstagramHandle: finalInstagramHandle,
    date,
    time,
    status,
    notes,
  });

  revalidatePath("/appointments");
  revalidatePath("/clients");
  revalidatePath("/planner");
  redirect("/appointments");
}

export async function updateAppointmentAction(formData: FormData) {
  const appointmentId = Number(formData.get("appointmentId") ?? 0);
  const clientId = Number(formData.get("clientId") ?? 0);
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const status = String(formData.get("status") ?? "scheduled") as AppointmentStatus;
  const notes = String(formData.get("notes") ?? "").trim();

  if (!appointmentId || !clientId || !date || !time) {
    return;
  }

  const selectedClient = await getClientById(clientId);

  if (!selectedClient) {
    return;
  }

  await updateAppointment({
    appointmentId,
    clientId: selectedClient.id,
    clientName: selectedClient.name,
    clientInstagramHandle: selectedClient.instagramHandle,
    date,
    time,
    status,
    notes,
  });

  revalidatePath("/appointments");
  revalidatePath("/planner");
}

export async function cancelAppointmentAction(formData: FormData) {
  const appointmentId = Number(formData.get("appointmentId") ?? 0);

  if (!appointmentId) {
    return;
  }

  await updateAppointmentStatus({
    appointmentId,
    status: "cancelled",
  });

  revalidatePath("/appointments");
  revalidatePath("/planner");
}

export async function completeAppointmentAction(formData: FormData) {
  const appointmentId = Number(formData.get("appointmentId") ?? 0);
  const serviceId = Number(formData.get("serviceId") ?? 0);
  const hasAddon = String(formData.get("hasAddon") ?? "") === "true";
  const addonIdValue = Number(formData.get("addonId") ?? 0);
  const addonId = hasAddon && addonIdValue > 0 ? addonIdValue : null;
  const price = Number(formData.get("price") ?? 0);
  const tipValue = String(formData.get("tip") ?? "").trim();
  const tip = tipValue === "" ? null : Number(tipValue);
  const notes = String(formData.get("notes") ?? "").trim();

  if (
    !appointmentId ||
    !serviceId ||
    !Number.isFinite(price) ||
    !Number.isInteger(price) ||
    price <= 0
  ) {
    return {
      error: "Wybierz usługę i wpisz poprawną kwotę za wizytę.",
      ok: false,
    };
  }

  if (
    tip !== null &&
    (!Number.isFinite(tip) || !Number.isInteger(tip) || tip < 0)
  ) {
    return {
      error: "Wpisz poprawny tip albo zostaw to pole puste.",
      ok: false,
    };
  }

  const selectedService = await getServiceById(serviceId);

  if (!selectedService) {
    return {
      error: "Nie udało się znaleźć wybranej usługi.",
      ok: false,
    };
  }

  if (selectedService.category !== "service") {
    return {
      error: "Wybierz poprawną usługę.",
      ok: false,
    };
  }

  let selectedAddon: null | Awaited<ReturnType<typeof getServiceById>> = null;

  if (hasAddon) {
    if (!addonId) {
      return {
        error: "Zaznaczony dodatek musi być wybrany z listy.",
        ok: false,
      };
    }

    selectedAddon = await getServiceById(addonId);

    if (!selectedAddon || selectedAddon.category !== "addon") {
      return {
        error: "Nie udało się znaleźć wybranego dodatku.",
        ok: false,
      };
    }
  }

  try {
    await completeAppointment({
      appointmentId,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      addonId: selectedAddon?.id ?? null,
      addonPrice: selectedAddon?.price ?? null,
      price,
      tip,
      notes,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Nie udało się zakończyć wizyty.";

    return {
      error: message,
      ok: false,
    };
  }

  revalidatePath("/appointments");
  revalidatePath("/planner");

  return {
    ok: true,
  };
}

export async function deleteAppointmentAction(formData: FormData) {
  const appointmentId = Number(formData.get("appointmentId") ?? 0);

  if (!appointmentId) {
    return;
  }

  await deleteAppointmentRecord(appointmentId);
  revalidatePath("/appointments");
  revalidatePath("/planner");
}
