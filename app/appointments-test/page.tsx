import { Suspense } from "react";
import AppointmentsTestExperience from "../../components/AppointmentsTestExperience";
import { getAppointments } from "../../lib/data/appointments";
import { getClientSummaries } from "../../lib/data/clients";
import { getServices } from "../../lib/data/services";
import { isSupabaseConfigured } from "../../lib/supabase/env";

export default function AppointmentsTestPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-7xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Wizyty TEST
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-normal text-slate-950">
            Połącz aplikację z Supabase
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Uzupełnij `.env.local` na podstawie `.env.example`, a potem uruchom SQL z
            pliku `supabase/schema.sql`.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <main className="mx-auto max-w-7xl">
        <Suspense fallback={<AppointmentsTestSkeleton />}>
          <AppointmentsTestContent />
        </Suspense>
      </main>
    </div>
  );
}

async function AppointmentsTestContent() {
  const [appointments, clients, services] = await Promise.all([
    getAppointments(),
    getClientSummaries(),
    getServices(),
  ]);

  return (
    <AppointmentsTestExperience
      appointments={appointments}
      clients={clients}
      services={services}
    />
  );
}

function AppointmentsTestSkeleton() {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-6 w-32 animate-pulse rounded-full bg-slate-200" />
        <div className="mt-5 h-10 w-56 animate-pulse rounded-full bg-slate-200" />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div
            key={item}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="h-4 w-20 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-4 h-8 w-14 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-3 h-4 w-28 animate-pulse rounded-full bg-slate-100" />
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {[0, 1].map((item) => (
          <article
            key={item}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="h-5 w-28 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-5 h-7 w-44 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
