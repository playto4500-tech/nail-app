"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createAppointment,
  createAppointmentAddons,
  deleteAppointmentAddons,
  deleteAppointmentRecord,
  type AppointmentStatus,
  updateAppointment,
  updateAppointmentStatus,
} from "../../lib/data/appointments";
import { createClientRecord, getClientById } from "../../lib/data/clients";
import { getServiceById, getServicesByIds } from "../../lib/data/services";

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
  const serviceId = Number(formData.get("serviceId") ?? 0);
  const addonIds = formData
    .getAll("addonIds")
    .map((value) => Number(value))
    .filter((value, index, values) => Number.isFinite(value) && value > 0 && values.indexOf(value) === index);
  const status = String(formData.get("status") ?? "scheduled") as AppointmentStatus;
  const notes = String(formData.get("notes") ?? "").trim();

  if (!date || !time || !serviceId) {
    return;
  }

  const selectedService = await getServiceById(serviceId);

  if (!selectedService) {
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

  const appointmentId = await createAppointment({
    clientId: finalClientId,
    clientName: finalClientName,
    clientInstagramHandle: finalInstagramHandle,
    date,
    time,
    serviceId,
    serviceName: selectedService.name,
    price: selectedService.price,
    status,
    notes,
  });

  if (addonIds.length > 0) {
    const addons = (await getServicesByIds(addonIds)).filter(
      (service) => service.category === "addon",
    );

    await createAppointmentAddons({
      appointmentId,
      addons: addons.map((addon) => ({
        serviceId: addon.id,
        price: addon.price,
      })),
    });
  }

  revalidatePath("/appointments");
  revalidatePath("/clients");
  redirect("/appointments");
}

export async function updateAppointmentAction(formData: FormData) {
  const appointmentId = Number(formData.get("appointmentId") ?? 0);
  const clientId = Number(formData.get("clientId") ?? 0);
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const serviceId = Number(formData.get("serviceId") ?? 0);
  const addonIds = formData
    .getAll("addonIds")
    .map((value) => Number(value))
    .filter(
      (value, index, values) =>
        Number.isFinite(value) && value > 0 && values.indexOf(value) === index,
    );
  const status = String(formData.get("status") ?? "scheduled") as AppointmentStatus;
  const notes = String(formData.get("notes") ?? "").trim();

  if (!appointmentId || !clientId || !date || !time || !serviceId) {
    return;
  }

  const [selectedClient, selectedService] = await Promise.all([
    getClientById(clientId),
    getServiceById(serviceId),
  ]);

  if (!selectedClient || !selectedService) {
    return;
  }

  await updateAppointment({
    appointmentId,
    clientId: selectedClient.id,
    clientName: selectedClient.name,
    clientInstagramHandle: selectedClient.instagramHandle,
    date,
    time,
    serviceId: selectedService.id,
    serviceName: selectedService.name,
    price: selectedService.price,
    status,
    notes,
  });

  await deleteAppointmentAddons(appointmentId);

  if (addonIds.length > 0) {
    const addons = (await getServicesByIds(addonIds)).filter(
      (service) => service.category === "addon",
    );

    await createAppointmentAddons({
      appointmentId,
      addons: addons.map((addon) => ({
        serviceId: addon.id,
        price: addon.price,
      })),
    });
  }

  revalidatePath("/appointments");
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
}

export async function deleteAppointmentAction(formData: FormData) {
  const appointmentId = Number(formData.get("appointmentId") ?? 0);

  if (!appointmentId) {
    return;
  }

  await deleteAppointmentRecord(appointmentId);
  revalidatePath("/appointments");
}
