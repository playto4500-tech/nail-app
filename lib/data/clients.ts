import { createClient } from "../../utils/supabase/server";

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

type ClientRow = {
  id: number;
  name: string;
  instagram_handle: null | string;
  status: ClientStatus;
  notes: null | string;
  created_at: string;
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
    .order("created_at", { ascending: false });

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
    .order("created_at", { ascending: false });

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
