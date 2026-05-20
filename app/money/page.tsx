import { createExpenseAction } from "../actions/expenses";
import {
  type FinancePeriodSummary,
  getFinanceSummary,
} from "../../lib/data/finances";
import { isSupabaseConfigured } from "../../lib/supabase/env";

function formatPrice(price: number) {
  return `${price.toLocaleString("pl-PL")} zł`;
}

function getTodayDateKey() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function PeriodCard({ summary }: { summary: FinancePeriodSummary }) {
  return (
    <article className="rounded-[24px] bg-white p-5 shadow-sm shadow-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{summary.label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {formatPrice(summary.profit)}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            summary.profit >= 0
              ? "bg-emerald-100 text-emerald-700"
              : "bg-rose-100 text-rose-700"
          }`}
        >
          Netto
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-slate-50 px-3 py-3">
          <p className="text-slate-500">Przychód</p>
          <p className="mt-1 font-semibold text-slate-900">
            {formatPrice(summary.income)}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-3 py-3">
          <p className="text-slate-500">Wydatki</p>
          <p className="mt-1 font-semibold text-slate-900">
            {formatPrice(summary.expenses)}
          </p>
        </div>
      </div>
    </article>
  );
}

export default async function MoneyPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="bg-slate-50 px-5 py-8 text-slate-900">
        <main className="mx-auto max-w-md space-y-6">
          <section className="rounded-[28px] bg-white p-6 shadow-sm shadow-slate-200">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
              Pieniądze
            </p>
            <h1 className="mt-4 text-3xl font-semibold leading-tight text-slate-900">
              Najpierw skonfiguruj Supabase
            </h1>
            <p className="mt-3 text-slate-600">
              Finanse zaczną działać po dodaniu `.env.local` i uruchomieniu SQL-i z
              folderu `supabase`.
            </p>
          </section>
        </main>
      </div>
    );
  }

  const summary = await getFinanceSummary();

  return (
    <div className="bg-slate-50 px-5 py-8 text-slate-900">
      <main className="mx-auto max-w-md space-y-6">
        <section className="rounded-[28px] bg-white p-6 shadow-sm shadow-slate-200">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
            Pieniądze
          </p>
          <h1 className="mt-4 text-3xl font-semibold leading-tight text-slate-900">
            Podsumowanie finansów
          </h1>
          <p className="mt-3 text-slate-600">
            Przychody liczymy z zakończonych wizyt, a wydatki dodajesz ręcznie.
          </p>
        </section>

        <section className="grid grid-cols-1 gap-4">
          <PeriodCard summary={summary.today} />
          <PeriodCard summary={summary.week} />
          <PeriodCard summary={summary.month} />
          <PeriodCard summary={summary.year} />
        </section>

        <form
          action={createExpenseAction}
          className="space-y-4 rounded-[24px] bg-white p-5 shadow-sm shadow-slate-200"
        >
          <div>
            <p className="text-sm font-semibold text-slate-900">Dodaj wydatek</p>
            <p className="mt-1 text-sm text-slate-500">
              Na razie zapisujemy go ręcznie, później podepniemy to pod zasoby.
            </p>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Nazwa</span>
            <input
              name="name"
              type="text"
              required
              placeholder="Np. żele, pilniki, rękawiczki"
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
                  placeholder="120"
                  className="w-full min-w-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
                <span className="shrink-0 text-sm font-semibold text-slate-500">PLN</span>
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
              placeholder="Np. Allepaznokcie, hurtownia, Rossmann"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Zapisz wydatek
          </button>
        </form>

        <section className="space-y-3 rounded-[24px] bg-white p-5 shadow-sm shadow-slate-200">
          <div>
            <p className="text-sm font-semibold text-slate-900">Miesiąc po miesiącu</p>
            <p className="mt-1 text-sm text-slate-500">
              Netto pokazuje przychody minus wydatki w danym miesiącu.
            </p>
          </div>

          <div className="space-y-2">
            {summary.months.map((month) => (
              <div
                key={month.monthKey}
                className="rounded-[20px] border border-slate-100 bg-slate-50 px-4 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">{month.label}</p>
                  <p
                    className={`text-sm font-semibold ${
                      month.profit >= 0 ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {formatPrice(month.profit)}
                  </p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-500">
                  <p>
                    Przychód:{" "}
                    <span className="font-semibold text-slate-900">
                      {formatPrice(month.income)}
                    </span>
                  </p>
                  <p>
                    Wydatki:{" "}
                    <span className="font-semibold text-slate-900">
                      {formatPrice(month.expenses)}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3 rounded-[24px] bg-white p-5 shadow-sm shadow-slate-200">
          <div>
            <p className="text-sm font-semibold text-slate-900">Ostatnie wydatki</p>
            <p className="mt-1 text-sm text-slate-500">
              Szybki podgląd ostatnich kosztów dodanych ręcznie.
            </p>
          </div>

          {summary.recentExpenses.length > 0 ? (
            <div className="space-y-2">
              {summary.recentExpenses.map((expense) => (
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
                    <p className="shrink-0 text-sm font-semibold text-rose-700">
                      {formatPrice(expense.amount)}
                    </p>
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
      </main>
    </div>
  );
}
