import { createClient } from "../../utils/supabase/server";
import type { ClientStatus } from "./clients";
import { normalizeKnownServiceName } from "./services";

export type AppointmentStatus = "confirmed" | "cancelled" | "scheduled" | "completed";

export type Appointment = {
  id: number;
  clientId: null | number;
  clientName: string;
  clientInstagramHandle: null | string;
  clientStatus: "regular" | "new";
  date: string;
  time: string;
  serviceId: null | number;
  serviceName: null | string;
  addonNames: string[];
  price: null | number;
  tip: null | number;
  status: AppointmentStatus;
  notes: string;
  deletedAt: null | string;
  createdAt: string;
};

type AppointmentRow = {
  id: number;
  client_id: null | number;
  client_name: string;
  client_instagram_handle: null | string;
  appointment_date: string;
  appointment_time: string;
  service_id: null | number;
  service_name: null | string;
  appointment_price: null | number;
  appointment_tip: null | number;
  status: AppointmentStatus;
  notes: null | string;
  deleted_at: null | string;
  created_at: string;
  clients:
    | null
    | {
        status: ClientStatus;
      }
    | Array<{
        status: ClientStatus;
      }>;
};

type AppointmentAddonRow = {
  appointment_id: number;
  services:
    | null
    | {
        name: string;
      }
    | Array<{
        name: string;
      }>;
};

export async function getAppointments(options?: { includeDeleted?: boolean }) {
  const supabase = await createClient();
  let appointmentsQuery = supabase
    .from("appointments")
    .select(
      "id, client_id, client_name, client_instagram_handle, appointment_date, appointment_time, service_id, service_name, appointment_price, appointment_tip, status, notes, deleted_at, created_at, clients(status)",
    )
    .order("appointment_date", { ascending: true })
    .order("appointment_time", { ascending: true });

  if (!options?.includeDeleted) {
    appointmentsQuery = appointmentsQuery.is("deleted_at", null);
  }

  const appointmentsResponse = await appointmentsQuery;

  if (appointmentsResponse.error) {
    throw new Error(
      `Failed to load appointments: ${appointmentsResponse.error.message}`,
    );
  }

  const appointmentRows = (appointmentsResponse.data ?? []) as AppointmentRow[];
  const appointmentIds = appointmentRows.map((appointment) => appointment.id);
  const addonsByAppointmentId = new Map<number, string[]>();

  if (appointmentIds.length > 0) {
    const appointmentAddonsResponse = await supabase
      .from("appointment_addons")
      .select("appointment_id, services(name)")
      .in("appointment_id", appointmentIds);

    if (appointmentAddonsResponse.error) {
      throw new Error(
        `Failed to load appointment addons: ${appointmentAddonsResponse.error.message}`,
      );
    }

    ((appointmentAddonsResponse.data ?? []) as AppointmentAddonRow[]).forEach((item) => {
      const relatedService = Array.isArray(item.services) ? item.services[0] : item.services;

      if (!relatedService?.name) {
        return;
      }

      const currentAddons = addonsByAppointmentId.get(item.appointment_id) ?? [];
      currentAddons.push(normalizeKnownServiceName(relatedService.name));
      addonsByAppointmentId.set(item.appointment_id, currentAddons);
    });
  }

  return appointmentRows.map((appointment) => {
    const relatedClient = Array.isArray(appointment.clients)
      ? appointment.clients[0]
      : appointment.clients;

    return {
      id: appointment.id,
      clientId: appointment.client_id,
      clientName: appointment.client_name || "Nieznana klientka",
      clientInstagramHandle: appointment.client_instagram_handle ?? null,
      clientStatus: relatedClient?.status ?? "new",
      date: appointment.appointment_date,
      time: appointment.appointment_time,
      serviceId: appointment.service_id,
      serviceName: appointment.service_name
        ? normalizeKnownServiceName(appointment.service_name)
        : null,
      addonNames: addonsByAppointmentId.get(appointment.id) ?? [],
      price: appointment.appointment_price,
      tip: appointment.appointment_tip,
      status: appointment.status,
      notes: appointment.notes ?? "",
      deletedAt: appointment.deleted_at,
      createdAt: appointment.created_at,
    };
  });
}

export async function createAppointment(input: {
  clientId: number;
  clientName: string;
  clientInstagramHandle: null | string;
  date: string;
  time: string;
  status: AppointmentStatus;
  notes: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .insert({
      client_id: input.clientId,
      client_name: input.clientName,
      client_instagram_handle: input.clientInstagramHandle || null,
      appointment_date: input.date,
      appointment_time: input.time,
      service_id: null,
      service_name: null,
      appointment_price: null,
      appointment_tip: null,
      status: input.status,
      notes: input.notes || null,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to create appointment: ${error.message}`);
  }

  return data.id as number;
}

export async function updateAppointment(input: {
  appointmentId: number;
  clientId: number;
  clientName: string;
  clientInstagramHandle: null | string;
  date: string;
  time: string;
  status: AppointmentStatus;
  notes: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("appointments")
    .update({
      client_id: input.clientId,
      client_name: input.clientName,
      client_instagram_handle: input.clientInstagramHandle || null,
      appointment_date: input.date,
      appointment_time: input.time,
      service_id: null,
      service_name: null,
      appointment_price: null,
      appointment_tip: null,
      status: input.status,
      notes: input.notes || null,
      deleted_at: null,
    })
    .eq("id", input.appointmentId);

  if (error) {
    throw new Error(`Failed to update appointment: ${error.message}`);
  }
}

export async function updateAppointmentStatus(input: {
  appointmentId: number;
  status: AppointmentStatus;
}) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("appointments")
    .update({
      status: input.status,
      deleted_at: null,
    })
    .eq("id", input.appointmentId);

  if (error) {
    throw new Error(`Failed to update appointment status: ${error.message}`);
  }
}

export async function completeAppointment(input: {
  appointmentId: number;
  serviceId: number;
  serviceName: string;
  addonId: null | number;
  addonPrice: null | number;
  price: number;
  tip: null | number;
  notes: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("appointments")
    .update({
      service_id: input.serviceId,
      service_name: input.serviceName,
      appointment_price: input.price,
      appointment_tip: input.tip,
      status: "completed",
      notes: input.notes || null,
      deleted_at: null,
    })
    .eq("id", input.appointmentId);

  if (error) {
    throw new Error(`Failed to complete appointment: ${error.message}`);
  }

  const deleteAddonsResponse = await supabase
    .from("appointment_addons")
    .delete()
    .eq("appointment_id", input.appointmentId);

  if (deleteAddonsResponse.error) {
    throw new Error(
      `Failed to clear appointment addons: ${deleteAddonsResponse.error.message}`,
    );
  }

  if (input.addonId && input.addonPrice !== null) {
    // `appointment_addons` still requires a positive snapshot price.
    const persistedAddonPrice = input.addonPrice > 0 ? input.addonPrice : 1;
    const insertAddonResponse = await supabase.from("appointment_addons").insert({
      appointment_id: input.appointmentId,
      service_id: input.addonId,
      addon_price: persistedAddonPrice,
    });

    if (insertAddonResponse.error) {
      throw new Error(
        `Failed to save appointment addon: ${insertAddonResponse.error.message}`,
      );
    }
  }
}

export async function deleteAppointmentRecord(appointmentId: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("appointments")
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq("id", appointmentId);

  if (error) {
    throw new Error(`Failed to delete appointment: ${error.message}`);
  }
}
