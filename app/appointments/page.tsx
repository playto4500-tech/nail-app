import { Suspense } from "react";
import { getAppointments } from "../../lib/data/appointments";
import { getClientSummaries } from "../../lib/data/clients";
import { getServices } from "../../lib/data/services";
import { isSupabaseConfigured } from "../../lib/supabase/env";
import AppointmentsExperience from "../../components/AppointmentsExperience";

export default function AppointmentsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="bg-slate-50 px-5 py-8 text-slate-900">
        <main className="mx-auto max-w-md space-y-6">
          <section className="rounded-[28px] bg-white p-6 shadow-sm shadow-slate-200">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
              Wizyty
            </p>
            <h1 className="mt-4 text-3xl font-semibold leading-tight text-slate-900">
              Połącz aplikację z Supabase
            </h1>
            <p className="mt-3 text-slate-600">
              Uzupełnij `.env.local` na podstawie `.env.example`, a potem uruchom SQL z
              pliku `supabase/schema.sql`.
            </p>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 px-5 py-8 text-slate-900">
      <main className="mx-auto max-w-md space-y-6">
        <section className="rounded-[28px] bg-white p-6 shadow-sm shadow-slate-200">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
            Wizyty
          </p>
          <h1 className="mt-4 text-3xl font-semibold leading-tight text-slate-900">
            Dzisiaj w planie
          </h1>
          <p className="mt-3 text-slate-600">
            Przeglądaj zaplanowane wizyty i przygotuj się na kolejnych klientów.
          </p>
        </section>

        <Suspense fallback={<AppointmentsListSkeleton />}>
          <AppointmentsContent />
        </Suspense>
      </main>
    </div>
  );
}

async function AppointmentsContent() {
  const [appointments, clients, services] = await Promise.all([
    getAppointments(),
    getClientSummaries(),
    getServices(),
  ]);

  return (
    <AppointmentsExperience
      appointments={appointments}
      clients={clients}
      services={services}
    />
  );
}

function AppointmentsListSkeleton() {
  return (
    <section className="space-y-4">
      <div className="rounded-[24px] bg-white p-5 shadow-sm shadow-slate-200">
        <div className="h-4 w-32 animate-pulse rounded-full bg-slate-200" />
        <div className="mt-3 h-8 w-14 animate-pulse rounded-full bg-slate-200" />
        <div className="mt-2 h-4 w-56 animate-pulse rounded-full bg-slate-100" />
      </div>

      {[0, 1].map((item) => (
        <article
          key={item}
          className="rounded-[24px] bg-white p-5 shadow-sm shadow-slate-200"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-3">
              <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
              <div className="h-6 w-40 animate-pulse rounded-full bg-slate-200" />
              <div className="h-4 w-28 animate-pulse rounded-full bg-slate-100" />
            </div>
            <div className="h-7 w-24 animate-pulse rounded-full bg-slate-200" />
          </div>

          <div className="mt-4 space-y-3">
            <div className="h-4 w-40 animate-pulse rounded-full bg-slate-100" />
            <div className="h-4 w-24 animate-pulse rounded-full bg-slate-100" />
            <div className="h-4 w-36 animate-pulse rounded-full bg-slate-100" />
          </div>
        </article>
      ))}
    </section>
  );
}
