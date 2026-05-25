"use server";

import { revalidatePath } from "next/cache";
import { actionError, actionOk, type ActionResult } from "../../lib/actions/results";
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

export async function updateClientAction(formData: FormData): Promise<ActionResult> {
  const id = Number(formData.get("clientId") ?? 0);
  const name = String(formData.get("name") ?? "").trim();
  const instagramHandle = String(formData.get("instagramHandle") ?? "").trim();
  const status = String(formData.get("status") ?? "new");
  const notes = String(formData.get("notes") ?? "").trim();

  if (!id || !name || (status !== "regular" && status !== "new")) {
    return actionError("Uzupełnij poprawnie dane klientki.");
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
    return actionError(
      error instanceof Error ? error.message : "Nie udało się zapisać klientki.",
    );
  }

  revalidatePath("/clients");
  revalidatePath("/appointments");
  revalidatePath("/appointments/new");

  return actionOk();
}

export async function deleteClientAction(formData: FormData): Promise<ActionResult> {
  const id = Number(formData.get("clientId") ?? 0);

  if (!id) {
    return actionError("Nie udało się znaleźć klientki do usunięcia.");
  }

  try {
    await deleteClientRecord(id);
  } catch (error) {
    return actionError(
      error instanceof Error ? error.message : "Nie udało się usunąć klientki.",
    );
  }

  revalidatePath("/clients");
  revalidatePath("/appointments");
  revalidatePath("/appointments/new");

  return actionOk();
}
