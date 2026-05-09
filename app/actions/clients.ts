"use server";

import { revalidatePath } from "next/cache";
import { createClientRecord } from "../../lib/data/clients";

export async function createClientAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const instagramHandle = String(formData.get("instagramHandle") ?? "").trim();
  const status = String(formData.get("status") ?? "new");
  const notes = String(formData.get("notes") ?? "").trim();

  if (!name || (status !== "regular" && status !== "new")) {
    return;
  }

  await createClientRecord({
    name,
    instagramHandle,
    status,
    notes,
  });

  revalidatePath("/clients");
  revalidatePath("/appointments/new");
}
