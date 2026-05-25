"use server";

import { revalidatePath } from "next/cache";
import { actionError, actionOk, type ActionResult } from "../../lib/actions/results";
import { createExpense, deleteExpense } from "../../lib/data/finances";

export async function createExpenseAction(formData: FormData): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);
  const source = String(formData.get("source") ?? "").trim();
  const date = String(formData.get("date") ?? "");

  if (!name || !source || !date || !Number.isInteger(amount) || amount <= 0) {
    return actionError("Uzupełnij nazwę, kwotę, źródło i datę wydatku.");
  }

  try {
    await createExpense({
      name,
      amount,
      source,
      date,
    });
  } catch (error) {
    return actionError(
      error instanceof Error ? error.message : "Nie udało się zapisać wydatku.",
    );
  }

  revalidatePath("/money");

  return actionOk();
}

export async function deleteExpenseAction(formData: FormData): Promise<ActionResult> {
  const expenseId = Number(formData.get("expenseId") ?? 0);

  if (!expenseId) {
    return actionError("Nie udało się znaleźć wydatku do usunięcia.");
  }

  try {
    await deleteExpense(expenseId);
  } catch (error) {
    return actionError(
      error instanceof Error ? error.message : "Nie udało się usunąć wydatku.",
    );
  }

  revalidatePath("/money");

  return actionOk();
}
