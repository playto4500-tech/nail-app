"use server";

import { revalidatePath } from "next/cache";
import { createExpense } from "../../lib/data/finances";

export async function createExpenseAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);
  const source = String(formData.get("source") ?? "").trim();
  const date = String(formData.get("date") ?? "");

  if (!name || !source || !date || !Number.isInteger(amount) || amount <= 0) {
    return;
  }

  await createExpense({
    name,
    amount,
    source,
    date,
  });

  revalidatePath("/money");
}
