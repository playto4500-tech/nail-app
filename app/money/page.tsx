import MoneyExperience from "../../components/MoneyExperience";
import { getFinanceSummary } from "../../lib/data/finances";
import { isSupabaseConfigured } from "../../lib/supabase/env";

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

        <MoneyExperience summary={summary} />
      </main>
    </div>
  );
}
