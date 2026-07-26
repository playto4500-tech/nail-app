import MoneyTestExperience from "../../components/MoneyTestExperience";
import { getFinanceSummary } from "../../lib/data/finances";
import { isSupabaseConfigured } from "../../lib/supabase/env";

export const dynamic = "force-dynamic";

export default async function MoneyTestPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-7xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Pieniądze TEST
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-normal text-slate-950">
            Najpierw skonfiguruj Supabase
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Testowy dashboard finansów zacznie działać po dodaniu `.env.local` i
            uruchomieniu SQL-i z folderu `supabase`.
          </p>
        </section>
      </div>
    );
  }

  const summary = await getFinanceSummary();

  return (
    <div className="bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <MoneyTestExperience summary={summary} />
      </div>
    </div>
  );
}
