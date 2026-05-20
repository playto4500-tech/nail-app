import ExpensesExperience from "../../components/ExpensesExperience";
import {
  type FinancePeriodSummary,
  getFinanceSummary,
} from "../../lib/data/finances";
import { isSupabaseConfigured } from "../../lib/supabase/env";

function formatPrice(price: number) {
  return `${price.toLocaleString("pl-PL")} zł`;
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
        </section>

        <section className="grid grid-cols-1 gap-4">
          <PeriodCard summary={summary.today} />
          <PeriodCard summary={summary.week} />
          <PeriodCard summary={summary.month} />
          <PeriodCard summary={summary.year} />
        </section>

        <ExpensesExperience recentExpenses={summary.recentExpenses} />

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

      </main>
    </div>
  );
}
