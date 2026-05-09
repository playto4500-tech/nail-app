import { createClient } from "../../utils/supabase/server";
import type { ClientStatus } from "./clients";

export type AppointmentStatus = "confirmed" | "cancelled" | "scheduled";

export type Appointment = {
  id: number;
  clientId: number;
  clientName: string;
  clientInstagramHandle: null | string;
  clientStatus: "regular" | "new";
  date: string;
  time: string;
  serviceId: number;
  serviceName: string;
  price: number;
  status: AppointmentStatus;
  notes: string;
  createdAt: string;
  addons: Array<{
    serviceId: number;
    name: string;
    price: number;
  }>;
};

type AppointmentRow = {
  id: number;
  client_id: number;
  client_name: string;
  client_instagram_handle: null | string;
  appointment_date: string;
  appointment_time: string;
  service_id: number;
  service_name: string;
  appointment_price: number;
  status: AppointmentStatus;
  notes: null | string;
  created_at: string;
  clients:
    | null
    | {
        status: ClientStatus;
      }
    | Array<{
        status: ClientStatus;
      }>;
  appointment_addons:
    | null
    | Array<{
        service_id: number;
        addon_price: number;
        services:
          | null
          | {
              id: number;
              name: string;
            }
          | Array<{
              id: number;
              name: string;
            }>;
      }>;
};

export async function getAppointments() {
  const supabase = await createClient();
  const appointmentsResponse = await supabase
    .from("appointments")
    .select(
      "id, client_id, client_name, client_instagram_handle, appointment_date, appointment_time, service_id, service_name, appointment_price, status, notes, created_at, clients(status), appointment_addons(service_id, addon_price, services(id, name))",
    )
    .order("appointment_date", { ascending: true })
    .order("appointment_time", { ascending: true });

  if (appointmentsResponse.error) {
    throw new Error(
      `Failed to load appointments: ${appointmentsResponse.error.message}`,
    );
  }

  return ((appointmentsResponse.data ?? []) as AppointmentRow[]).map((appointment) => {
    const relatedClient = Array.isArray(appointment.clients)
      ? appointment.clients[0]
      : appointment.clients;
    const addons = (appointment.appointment_addons ?? []).map((addon) => {
      const relatedService = Array.isArray(addon.services)
        ? addon.services[0]
        : addon.services;

      return {
        serviceId: addon.service_id,
        name: relatedService?.name ?? "Dodatek",
        price: addon.addon_price,
      };
    });

    return {
      id: appointment.id,
      clientId: appointment.client_id,
      clientName: appointment.client_name || "Nieznana klientka",
      clientInstagramHandle: appointment.client_instagram_handle ?? null,
      clientStatus: relatedClient?.status ?? "new",
      date: appointment.appointment_date,
      time: appointment.appointment_time,
      serviceId: appointment.service_id,
      serviceName: appointment.service_name || "Nieznana usługa",
      price: appointment.appointment_price,
      status: appointment.status,
      notes: appointment.notes ?? "",
      createdAt: appointment.created_at,
      addons,
    };
  });
}

export async function createAppointment(input: {
  clientId: number;
  clientName: string;
  clientInstagramHandle: null | string;
  date: string;
  time: string;
  serviceId: number;
  serviceName: string;
  price: number;
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
      service_id: input.serviceId,
      service_name: input.serviceName,
      appointment_price: input.price,
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
  serviceId: number;
  serviceName: string;
  price: number;
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
      service_id: input.serviceId,
      service_name: input.serviceName,
      appointment_price: input.price,
      status: input.status,
      notes: input.notes || null,
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
    })
    .eq("id", input.appointmentId);

  if (error) {
    throw new Error(`Failed to update appointment status: ${error.message}`);
  }
}

export async function createAppointmentAddons(input: {
  appointmentId: number;
  addons: Array<{
    serviceId: number;
    price: number;
  }>;
}) {
  if (input.addons.length === 0) {
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("appointment_addons").insert(
    input.addons.map((addon) => ({
      appointment_id: input.appointmentId,
      service_id: addon.serviceId,
      addon_price: addon.price,
    })),
  );

  if (error) {
    throw new Error(`Failed to create appointment addons: ${error.message}`);
  }
}

export async function deleteAppointmentAddons(appointmentId: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("appointment_addons")
    .delete()
    .eq("appointment_id", appointmentId);

  if (error) {
    throw new Error(`Failed to delete appointment addons: ${error.message}`);
  }
}

export async function deleteAppointmentRecord(appointmentId: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("appointments").delete().eq("id", appointmentId);

  if (error) {
    throw new Error(`Failed to delete appointment: ${error.message}`);
  }
}
