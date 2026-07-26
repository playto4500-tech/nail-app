import { createClient } from "../../utils/supabase/server";
import { getTodayDateKey, normalizeTime } from "../utils/date";

export type ClientStatus = "regular" | "new" | "family";
export type ClientClassification =
  | "family"
  | "new"
  | "regular"
  | "sporadic"
  | "returning";

export type ClientItem = {
  id: number;
  name: string;
  instagramHandle: null | string;
  status: ClientStatus;
  classification: ClientClassification;
  notes: string;
  createdAt: string;
};

export type ClientSummary = Pick<
  ClientItem,
  "id" | "name" | "instagramHandle" | "status" | "classification"
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

type ClientClassificationVisitRow = {
  client_id: null | number;
  appointment_date: string;
  status: ClientVisit["status"];
  deleted_at: null | string;
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

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

function mapClientSummary(
  client: Pick<ClientRow, "id" | "name" | "instagram_handle" | "status">,
  classification: ClientClassification,
) {
  return {
    id: client.id,
    name: client.name,
    instagramHandle: client.instagram_handle,
    status: client.status,
    classification,
  };
}

async function getClientRows(supabase: SupabaseClient) {
  return supabase
    .from("clients")
    .select("id, name, instagram_handle, status, notes, created_at")
    .order("name", { ascending: true });
}

async function getClientSummaryRows(supabase: SupabaseClient) {
  return supabase
    .from("clients")
    .select("id, name, instagram_handle, status")
    .order("name", { ascending: true });
}

async function getClientClassificationVisits(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("appointments")
    .select("client_id, appointment_date, status, deleted_at")
    .order("appointment_date", { ascending: true });

  if (error) {
    throw new Error(`Failed to load client classification visits: ${error.message}`);
  }

  return ((data ?? []) as ClientClassificationVisitRow[]).filter(
    (visit) => !visit.deleted_at && visit.client_id,
  );
}

function getDaysBetweenDateKeys(fromDateKey: string, toDateKey: string) {
  const fromDate = new Date(`${fromDateKey}T12:00:00`);
  const toDate = new Date(`${toDateKey}T12:00:00`);
  const dayInMs = 1000 * 60 * 60 * 24;

  return Math.max(0, Math.round((toDate.getTime() - fromDate.getTime()) / dayInMs));
}

function getMedian(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  const sortedValues = [...values].sort((first, second) => first - second);
  const middleIndex = Math.floor(sortedValues.length / 2);

  if (sortedValues.length % 2 === 1) {
    return sortedValues[middleIndex];
  }

  return Math.round((sortedValues[middleIndex - 1] + sortedValues[middleIndex]) / 2);
}

function classifyClient(input: {
  storedStatus: ClientStatus;
  completedVisitDates: string[];
  hasUpcomingAppointment: boolean;
  todayKey: string;
}): ClientClassification {
  if (input.storedStatus === "family") {
    return "family";
  }

  if (input.completedVisitDates.length <= 1) {
    return "new";
  }

  const sortedCompletedDates = [...input.completedVisitDates].sort();
  const lastCompletedDate = sortedCompletedDates[sortedCompletedDates.length - 1];
  const daysSinceLastCompletedVisit = getDaysBetweenDateKeys(
    lastCompletedDate,
    input.todayKey,
  );

  if (input.hasUpcomingAppointment && daysSinceLastCompletedVisit >= 120) {
    return "returning";
  }

  const recentDates = sortedCompletedDates.slice(-5);
  const intervals = recentDates.slice(1).map((date, index) =>
    getDaysBetweenDateKeys(recentDates[index], date),
  );
  const medianInterval = getMedian(intervals);

  if (
    sortedCompletedDates.length >= 3 &&
    medianInterval <= 35 &&
    daysSinceLastCompletedVisit <= 49
  ) {
    return "regular";
  }

  return "sporadic";
}

function createClassificationsByClientId(
  clients: Array<Pick<ClientRow, "id" | "status">>,
  visits: ClientClassificationVisitRow[],
) {
  const todayKey = getTodayDateKey();

  return new Map(
    clients.map((client) => {
      const clientVisits = visits.filter((visit) => visit.client_id === client.id);
      const completedVisitDates = clientVisits
        .filter(
          (visit) =>
            visit.status === "completed" && visit.appointment_date <= todayKey,
        )
        .map((visit) => visit.appointment_date);
      const hasUpcomingAppointment = clientVisits.some(
        (visit) =>
          (visit.status === "confirmed" || visit.status === "scheduled") &&
          visit.appointment_date >= todayKey,
      );

      return [
        client.id,
        classifyClient({
          storedStatus: client.status,
          completedVisitDates,
          hasUpcomingAppointment,
          todayKey,
        }),
      ];
    }),
  );
}

export async function getClients() {
  const supabase = await createClient();
  const [clientsResponse, classificationVisits] = await Promise.all([
    getClientRows(supabase),
    getClientClassificationVisits(supabase),
  ]);
  const { data, error } = clientsResponse;

  if (error) {
    throw new Error(`Failed to load clients: ${error.message}`);
  }

  const clientRows = (data ?? []) as ClientRow[];
  const classificationsByClientId = createClassificationsByClientId(
    clientRows,
    classificationVisits,
  );

  return clientRows.map((client) => ({
    ...mapClientSummary(
      client,
      classificationsByClientId.get(client.id) ?? "new",
    ),
    notes: client.notes ?? "",
    createdAt: client.created_at,
  }));
}

export async function getClientSummaries() {
  const supabase = await createClient();
  const [clientsResponse, classificationVisits] = await Promise.all([
    getClientSummaryRows(supabase),
    getClientClassificationVisits(supabase),
  ]);
  const { data, error } = clientsResponse;

  if (error) {
    throw new Error(`Failed to load client summaries: ${error.message}`);
  }

  const clientRows = (data ?? []) as ClientRow[];
  const classificationsByClientId = createClassificationsByClientId(
    clientRows,
    classificationVisits,
  );

  return clientRows.map((client) =>
    mapClientSummary(
      client,
      classificationsByClientId.get(client.id) ?? "new",
    ),
  );
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

  const client = data as Pick<ClientRow, "id" | "name" | "instagram_handle" | "status">;
  const classificationsByClientId = createClassificationsByClientId(
    [client],
    await getClientClassificationVisits(supabase),
  );

  return mapClientSummary(
    client,
    classificationsByClientId.get(client.id) ?? "new",
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
