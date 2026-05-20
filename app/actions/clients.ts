"use server";

import { revalidatePath } from "next/cache";
import {
  createClientRecord,
  deleteClientRecord,
  updateClientRecord,
} from "../../lib/data/clients";

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

export async function updateClientAction(formData: FormData) {
  const id = Number(formData.get("clientId") ?? 0);
  const name = String(formData.get("name") ?? "").trim();
  const instagramHandle = String(formData.get("instagramHandle") ?? "").trim();
  const status = String(formData.get("status") ?? "new");
  const notes = String(formData.get("notes") ?? "").trim();

  if (!id || !name || (status !== "regular" && status !== "new")) {
    return {
      ok: false,
    };
  }

  try {
    await updateClientRecord({
      id,
      name,
      instagramHandle,
      status,
      notes,
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Nie udało się zapisać klientki.",
      ok: false,
    };
  }

  revalidatePath("/clients");
  revalidatePath("/appointments");
  revalidatePath("/appointments/new");

  return {
    ok: true,
  };
}

export async function deleteClientAction(formData: FormData) {
  const id = Number(formData.get("clientId") ?? 0);

  if (!id) {
    return {
      ok: false,
    };
  }

  try {
    await deleteClientRecord(id);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Nie udało się usunąć klientki.",
      ok: false,
    };
  }

  revalidatePath("/clients");
  revalidatePath("/appointments");
  revalidatePath("/appointments/new");

  return {
    ok: true,
  };
}
