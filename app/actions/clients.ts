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
  const isFamilyType = String(formData.get("clientType") ?? "") === "family";
  const notes = String(formData.get("notes") ?? "").trim();

  if (!name) {
    return;
  }

  await createClientRecord({
    name,
    instagramHandle,
    status: isFamilyType ? "family" : "new",
    notes,
  });

  revalidatePath("/clients");
  revalidatePath("/appointments-test");
  revalidatePath("/appointments/new");
}

export async function updateClientAction(formData: FormData): Promise<ActionResult> {
  const id = Number(formData.get("clientId") ?? 0);
  const name = String(formData.get("name") ?? "").trim();
  const instagramHandle = String(formData.get("instagramHandle") ?? "").trim();
  const isFamilyType = String(formData.get("clientType") ?? "") === "family";
  const notes = String(formData.get("notes") ?? "").trim();

  if (!id || !name) {
    return actionError("Uzupełnij poprawnie dane klientki.");
  }

  try {
    await updateClientRecord({
      id,
      name,
      instagramHandle,
      status: isFamilyType ? "family" : "new",
      notes,
    });
  } catch (error) {
    return actionError(
      error instanceof Error ? error.message : "Nie udało się zapisać klientki.",
    );
  }

  revalidatePath("/clients");
  revalidatePath("/appointments");
  revalidatePath("/appointments-test");
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
  revalidatePath("/appointments-test");
  revalidatePath("/appointments/new");

  return actionOk();
}
