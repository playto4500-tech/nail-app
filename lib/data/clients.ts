import { createClient } from "../../utils/supabase/server";
import { getTodayDateKey, normalizeTime } from "../utils/date";

export type ClientStatus = "regular" | "new";

export type ClientItem = {
  id: number;
  name: string;
  instagramHandle: null | string;
  status: ClientStatus;
  notes: string;
  createdAt: string;
};

export type ClientSummary = Pick<
  ClientItem,
  "id" | "name" | "instagramHandle" | "status"
>;

export type ClientVisit = {
  id: number;
  clientId: null | number;
  date: string;
  time: string;
  serviceName: null | string;
  price: null | number;
  tip: null | number;
  status: "confirmed" | "cancelled" | "scheduled" | "completed";
  notes: string;
};

type ClientRow = {
  id: number;
  name: string;
  instagram_handle: null | string;
  status: ClientStatus;
  notes: null | string;
  created_at: string;
};

type ClientVisitRow = {
  id: number;
  client_id: null | number;
  appointment_date: string;
  appointment_time: string;
  service_name: null | string;
  appointment_price: null | number;
  appointment_tip: null | number;
  status: ClientVisit["status"];
  notes: null | string;
  deleted_at: null | string;
};

function mapClientSummary(client: Pick<ClientRow, "id" | "name" | "instagram_handle" | "status">) {
  return {
    id: client.id,
    name: client.name,
    instagramHandle: client.instagram_handle,
    status: client.status,
  };
}

export async function getClients() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, instagram_handle, status, notes, created_at")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load clients: ${error.message}`);
  }

  return ((data ?? []) as ClientRow[]).map((client) => ({
    ...mapClientSummary(client),
    notes: client.notes ?? "",
    createdAt: client.created_at,
  }));
}

export async function getClientSummaries() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, instagram_handle, status")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load client summaries: ${error.message}`);
  }

  return (
    (data ?? []) as Array<Pick<ClientRow, "id" | "name" | "instagram_handle" | "status">>
  ).map(mapClientSummary);
}

export async function getClientById(id: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, instagram_handle, status")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load client: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapClientSummary(
    data as Pick<ClientRow, "id" | "name" | "instagram_handle" | "status">,
  );
}

export async function getClientVisitHistories() {
  const supabase = await createClient();
  const todayKey = getTodayDateKey();
  const { data, error } = await supabase
    .from("appointments")
    .select(
      "id, client_id, appointment_date, appointment_time, service_name, appointment_price, appointment_tip, status, notes, deleted_at",
    )
    .order("appointment_date", { ascending: false })
    .order("appointment_time", { ascending: false });

  if (error) {
    throw new Error(`Failed to load client visits: ${error.message}`);
  }

  return ((data ?? []) as ClientVisitRow[]).reduce<Record<number, ClientVisit[]>>(
    (visitsByClient, visit) => {
      if (visit.deleted_at) {
        return visitsByClient;
      }

      const isPreviousVisit =
        visit.status === "completed" || visit.appointment_date < todayKey;

      if (!isPreviousVisit) {
        return visitsByClient;
      }

      if (!visit.client_id) {
        return visitsByClient;
      }

      const currentVisits = visitsByClient[visit.client_id] ?? [];
      visitsByClient[visit.client_id] = [
        ...currentVisits,
        {
          id: visit.id,
          clientId: visit.client_id,
          date: visit.appointment_date,
          time: normalizeTime(visit.appointment_time),
          serviceName: visit.service_name,
          price: visit.appointment_price,
          tip: visit.appointment_tip,
          status: visit.status,
          notes: visit.notes ?? "",
        },
      ];

      return visitsByClient;
    },
    {},
  );
}

export async function createClientRecord(input: {
  name: string;
  instagramHandle: string;
  status: ClientStatus;
  notes: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .insert({
      name: input.name,
      instagram_handle: input.instagramHandle || null,
      status: input.status,
      notes: input.notes || null,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to create client: ${error.message}`);
  }

  return data.id as number;
}

export async function updateClientRecord(input: {
  id: number;
  name: string;
  instagramHandle: string;
  status: ClientStatus;
  notes: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({
      name: input.name,
      instagram_handle: input.instagramHandle || null,
      status: input.status,
      notes: input.notes || null,
    })
    .eq("id", input.id);

  if (error) {
    throw new Error(`Failed to update client: ${error.message}`);
  }
}

export async function deleteClientRecord(id: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("clients").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete client: ${error.message}`);
  }
}
