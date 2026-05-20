"use server";

import { revalidatePath } from "next/cache";
import { createExpense, deleteExpense } from "../../lib/data/finances";

export async function createExpenseAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);
  const source = String(formData.get("source") ?? "").trim();
  const date = String(formData.get("date") ?? "");

  if (!name || !source || !date || !Number.isInteger(amount) || amount <= 0) {
    return {
      error: "Uzupełnij nazwę, kwotę, źródło i datę wydatku.",
      ok: false,
    };
  }

  try {
    await createExpense({
      name,
      amount,
      source,
      date,
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Nie udało się zapisać wydatku.",
      ok: false,
    };
  }

  revalidatePath("/money");

  return {
    ok: true,
  };
}

export async function deleteExpenseAction(formData: FormData) {
  const expenseId = Number(formData.get("expenseId") ?? 0);

  if (!expenseId) {
    return {
      error: "Nie udało się znaleźć wydatku do usunięcia.",
      ok: false,
    };
  }

  try {
    await deleteExpense(expenseId);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Nie udało się usunąć wydatku.",
      ok: false,
    };
  }

  revalidatePath("/money");

  return {
    ok: true,
  };
}
