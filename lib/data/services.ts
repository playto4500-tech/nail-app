import { createClient } from "../../utils/supabase/server";

export type ServiceCategory = "service" | "addon";

export type ServiceItem = {
  id: number;
  category: ServiceCategory;
  name: string;
  price: number;
};

export function normalizeKnownServiceName(name: string) {
  const normalizedName = name.trim();
  const knownNames: Record<string, string> = {
    "Przedluzania zelowe do 2": "Przedłużenie żelowe do 2",
    "Przedluzenie zelowe do 2": "Przedłużenie żelowe do 2",
    "Przedłużanie paznokci": "Przedłużenie żelowe do 2",
    "Przedluzanie zelowe od 2": "Przedłużenie żelowe od 2",
    "Przedluzenie zelowe od 2": "Przedłużenie żelowe od 2",
    "Uzupelnienie": "Uzupełnienie",
    "Uzupełnienie hybrydy": "Uzupełnienie",
    "Zel na naturalnej plytce": "Żel na naturalnej płytce",
    "Pylek": "Wzorki",
    "pylek": "Wzorki",
  };

  return knownNames[normalizedName] ?? normalizedName;
}

function mapService(service: ServiceItem) {
  return {
    ...service,
    name: normalizeKnownServiceName(service.name),
  };
}

export async function getServices() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select("id, category, name, price")
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load services: ${error.message}`);
  }

  return ((data ?? []) as ServiceItem[]).map(mapService);
}

export async function getServiceById(id: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select("id, category, name, price")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load service: ${error.message}`);
  }

  const service = (data as ServiceItem | null) ?? null;

  return service ? mapService(service) : null;
}

export async function getServicesByIds(ids: number[]) {
  if (ids.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select("id, category, name, price")
    .in("id", ids)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load services by ids: ${error.message}`);
  }

  return ((data ?? []) as ServiceItem[]).map(mapService);
}

export async function createService(service: Omit<ServiceItem, "id">) {
  const supabase = await createClient();
  const { error } = await supabase.from("services").insert(service);

  if (error) {
    throw new Error(`Failed to create service: ${error.message}`);
  }
}

export async function updateService(service: ServiceItem) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .update({
      category: service.category,
      name: service.name,
      price: service.price,
    })
    .eq("id", service.id);

  if (error) {
    throw new Error(`Failed to update service: ${error.message}`);
  }
}
