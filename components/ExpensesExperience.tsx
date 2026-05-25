"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createExpenseAction, deleteExpenseAction } from "../app/actions/expenses";
import type { Expense } from "../lib/data/finances";
import { useBodyScrollLock } from "../lib/hooks/useBodyScrollLock";
import { useEscapeToClose } from "../lib/hooks/useEscapeToClose";
import { formatPrice } from "../lib/ui/format";
import { getTodayDateKey } from "../lib/utils/date";

type Props = {
  recentExpenses: Expense[];
};

export default function ExpensesExperience({ recentExpenses }: Props) {
  const router = useRouter();
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState("");

  function openExpenseModal() {
    setActionError("");
    setIsExpenseModalOpen(true);
  }

  function closeExpenseModal() {
    if (isPending) {
      return;
    }

    setActionError("");
    setIsExpenseModalOpen(false);
  }

  useBodyScrollLock(isExpenseModalOpen);
  useEscapeToClose({
    enabled: isExpenseModalOpen,
    isBlocked: isPending,
    onClose: closeExpenseModal,
  });

  async function submitExpense(formData: FormData) {
    startTransition(async () => {
      const result = await createExpenseAction(formData);

      if (!result.ok) {
        setActionError(
          result.error ??
            "Nie udało się zapisać wydatku. Sprawdź, czy SQL 006 jest odpalony.",
        );
        return;
      }

      setIsExpenseModalOpen(false);
      setActionError("");
      router.refresh();
    });
  }

  async function submitDeleteExpense(formData: FormData) {
    startTransition(async () => {
      const result = await deleteExpenseAction(formData);

      if (!result.ok) {
        setActionError(
          result.error ??
            "Nie udało się usunąć wydatku. Sprawdź, czy SQL 006 jest odpalony.",
        );
        return;
      }

      router.refresh();
    });
  }

  return (
    <>
      <section className="rounded-[24px] bg-white p-5 shadow-sm shadow-slate-200">
        <button
          type="button"
          onClick={openExpenseModal}
          className="flex w-full items-center justify-between gap-4 rounded-[20px] border border-slate-100 bg-slate-50 px-4 py-4 text-left transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300"
        >
          <p className="text-sm font-semibold text-slate-900">Dodaj wydatek</p>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-xl font-semibold text-white">
            +
          </span>
        </button>
      </section>

      <section className="space-y-3 rounded-[24px] bg-white p-5 shadow-sm shadow-slate-200">
        <div>
          <p className="text-sm font-semibold text-slate-900">Ostatnie wydatki</p>
        </div>

        {actionError && !isExpenseModalOpen ? (
          <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {actionError}
          </div>
        ) : null}

        {recentExpenses.length > 0 ? (
          <div className="space-y-2">
            {recentExpenses.map((expense) => (
              <div
                key={expense.id}
                className="rounded-[20px] border border-slate-100 bg-slate-50 px-4 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {expense.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">{expense.source}</p>
                  </div>
                  <div className="flex shrink-0 items-start gap-2">
                    <p className="pt-1 text-sm font-semibold text-rose-700">
                      {formatPrice(expense.amount)}
                    </p>
                    <form action={submitDeleteExpense}>
                      <input type="hidden" name="expenseId" value={expense.id} />
                      <button
                        type="submit"
                        disabled={isPending}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-500 transition hover:bg-rose-50 hover:text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-200 disabled:opacity-50"
                        aria-label={`Usuń wydatek: ${expense.name}`}
                      >
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        >
                          <path d="M3 6h18" />
                          <path d="M8 6V4h8v2" />
                          <path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 11v5" />
                          <path d="M14 11v5" />
                        </svg>
                      </button>
                    </form>
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-500">{expense.date}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
            Nie ma jeszcze zapisanych wydatków.
          </div>
        )}
      </section>

      {isExpenseModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-4 backdrop-blur-[2px] sm:items-center">
          <div
            className="absolute inset-0"
            onClick={closeExpenseModal}
            aria-hidden="true"
          />
          <section className="relative z-10 max-h-[85vh] w-full max-w-md overflow-y-auto rounded-[28px] bg-white p-6 shadow-xl shadow-slate-300">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                  Nowy wydatek
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  Dodaj koszt
                </h2>
              </div>
              <button
                type="button"
                onClick={closeExpenseModal}
                disabled={isPending}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                aria-label="Zamknij dodawanie wydatku"
              >
                ✕
              </button>
            </div>

            <form action={submitExpense} className="mt-6 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Nazwa</span>
                <input
                  name="name"
                  type="text"
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                />
              </label>

              <div className="grid grid-cols-1 gap-3 min-[440px]:grid-cols-2">
                <label className="block min-w-0 space-y-2">
                  <span className="text-sm font-medium text-slate-700">Kwota</span>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-slate-400">
                    <input
                      name="amount"
                      type="number"
                      min="1"
                      step="1"
                      required
                      className="w-full min-w-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    />
                    <span className="shrink-0 text-sm font-semibold text-slate-500">
                      PLN
                    </span>
                  </div>
                </label>

                <label className="block min-w-0 space-y-2">
                  <span className="text-sm font-medium text-slate-700">Data</span>
                  <input
                    name="date"
                    type="date"
                    required
                    defaultValue={getTodayDateKey()}
                    className="w-full min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] text-slate-900 outline-none transition focus:border-slate-400"
                  />
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Źródło</span>
                <input
                  name="source"
                  type="text"
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                />
              </label>

              {actionError ? (
                <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {actionError}
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeExpenseModal}
                  disabled={isPending}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Wróć
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400"
                >
                  {isPending ? "Zapisywanie..." : "Zapisz"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
