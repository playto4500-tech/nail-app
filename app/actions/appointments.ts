"use server";

import { revalidatePath } from "next/cache";
import { actionError, actionOk, type ActionResult } from "../../lib/actions/results";
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

export async function createAppointmentAction(formData: FormData): Promise<ActionResult> {
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
    return actionError("Data i godzina są wymagane.");
  }

  let finalClientId = clientId;
  let finalClientName = clientName;
  let finalInstagramHandle: null | string = instagramHandle || null;

  if (isNewClient) {
    if (!clientName) {
      return actionError("Wpisz imię klientki.");
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
      return actionError("Wybierz poprawną klientkę.");
    }

    finalClientName = selectedClient.name;
    finalInstagramHandle = selectedClient.instagramHandle;
  }

  if (!finalClientId || !finalClientName) {
    return actionError("Nie udało się ustalić danych klientki.");
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

  return actionOk();
}

export async function updateAppointmentAction(formData: FormData): Promise<ActionResult> {
  const appointmentId = Number(formData.get("appointmentId") ?? 0);
  const clientId = Number(formData.get("clientId") ?? 0);
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const status = String(formData.get("status") ?? "scheduled") as AppointmentStatus;
  const notes = String(formData.get("notes") ?? "").trim();

  if (!appointmentId || !clientId || !date || !time) {
    return actionError("Uzupełnij klientkę, datę i godzinę wizyty.");
  }

  const selectedClient = await getClientById(clientId);

  if (!selectedClient) {
    return actionError("Wybierz poprawną klientkę.");
  }

  try {
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
  } catch (error) {
    return actionError(
      error instanceof Error ? error.message : "Nie udało się zapisać wizyty.",
    );
  }

  revalidatePath("/appointments");
  revalidatePath("/planner");

  return actionOk();
}

export async function cancelAppointmentAction(formData: FormData): Promise<ActionResult> {
  const appointmentId = Number(formData.get("appointmentId") ?? 0);

  if (!appointmentId) {
    return actionError("Nie udało się znaleźć wizyty do anulowania.");
  }

  try {
    await updateAppointmentStatus({
      appointmentId,
      status: "cancelled",
    });
  } catch (error) {
    return actionError(
      error instanceof Error ? error.message : "Nie udało się anulować wizyty.",
    );
  }

  revalidatePath("/appointments");
  revalidatePath("/planner");

  return actionOk();
}

export async function completeAppointmentAction(formData: FormData): Promise<ActionResult> {
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
    return actionError("Wybierz usługę i wpisz poprawną kwotę za wizytę.");
  }

  if (
    tip !== null &&
    (!Number.isFinite(tip) || !Number.isInteger(tip) || tip < 0)
  ) {
    return actionError("Wpisz poprawny tip albo zostaw to pole puste.");
  }

  const selectedService = await getServiceById(serviceId);

  if (!selectedService) {
    return actionError("Nie udało się znaleźć wybranej usługi.");
  }

  if (selectedService.category !== "service") {
    return actionError("Wybierz poprawną usługę.");
  }

  let selectedAddon: null | Awaited<ReturnType<typeof getServiceById>> = null;

  if (hasAddon) {
    if (!addonId) {
      return actionError("Zaznaczony dodatek musi być wybrany z listy.");
    }

    selectedAddon = await getServiceById(addonId);

    if (!selectedAddon || selectedAddon.category !== "addon") {
      return actionError("Nie udało się znaleźć wybranego dodatku.");
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

    return actionError(message);
  }

  revalidatePath("/appointments");
  revalidatePath("/planner");

  return actionOk();
}

export async function deleteAppointmentAction(formData: FormData): Promise<ActionResult> {
  const appointmentId = Number(formData.get("appointmentId") ?? 0);

  if (!appointmentId) {
    return actionError("Nie udało się znaleźć wizyty do usunięcia.");
  }

  try {
    await deleteAppointmentRecord(appointmentId);
  } catch (error) {
    return actionError(
      error instanceof Error ? error.message : "Nie udało się usunąć wizyty.",
    );
  }

  revalidatePath("/appointments");
  revalidatePath("/planner");

  return actionOk();
}
