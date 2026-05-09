"use server";

import { revalidatePath } from "next/cache";
import { createService, updateService } from "../../lib/data/services";

export async function createServiceAction(formData: FormData) {
  const category = String(formData.get("category") ?? "service");
  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price") ?? 0);

  if (!name || !price || (category !== "service" && category !== "addon")) {
    return;
  }

  await createService({
    category,
    name,
    price,
  });

  revalidatePath("/services");
  revalidatePath("/appointments/new");
}

export async function updateServiceAction(formData: FormData) {
  const id = Number(formData.get("id") ?? 0);
  const category = String(formData.get("category") ?? "service");
  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price") ?? 0);

  if (!id || !name || !price || (category !== "service" && category !== "addon")) {
    return;
  }

  await updateService({
    id,
    category,
    name,
    price,
  });

  revalidatePath("/services");
  revalidatePath("/appointments/new");
  revalidatePath("/appointments");
}
