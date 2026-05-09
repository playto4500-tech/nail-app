import { Suspense } from "react";
import Link from "next/link";
import NewAppointmentForm from "../../../components/NewAppointmentForm";
import { getClientSummaries } from "../../../lib/data/clients";
import { getServices } from "../../../lib/data/services";
import { isSupabaseConfigured } from "../../../lib/supabase/env";

export default function NewAppointmentPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="bg-slate-50 px-5 py-8 text-slate-900">
        <main className="mx-auto max-w-md space-y-6">
          <section className="rounded-[28px] bg-white p-6 shadow-sm shadow-slate-200">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
              Wizyty
            </p>
            <h1 className="mt-4 text-3xl font-semibold leading-tight text-slate-900">
              Najpierw skonfiguruj Supabase
            </h1>
            <p className="mt-3 text-slate-600">
              Ta strona zacznie działać po dodaniu `.env.local` i uruchomieniu
              `supabase/schema.sql`.
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
            Dodaj nową wizytę
          </h1>
          <p className="mt-3 text-slate-600">
            Uzupełnij podstawowe dane wizyty dla klientki.
          </p>
        </section>

        <Suspense fallback={<NewAppointmentFormSkeleton />}>
          <NewAppointmentPageContent />
        </Suspense>
      </main>
    </div>
  );
}

async function NewAppointmentPageContent() {
  const [clients, services] = await Promise.all([
    getClientSummaries(),
    getServices(),
  ]);

  return (
    <>
      <NewAppointmentForm clients={clients} services={services} />

      {clients.length === 0 ? (
        <section className="rounded-[24px] border border-dashed border-slate-200 bg-white p-5 shadow-sm shadow-slate-200">
          <p className="text-sm text-slate-600">
            Nie masz jeszcze żadnej klientki w bazie, więc formularz domyślnie przełącza
            się na tryb nowej klientki.
          </p>
          <Link
            href="/clients"
            className="mt-4 inline-flex text-sm font-semibold text-slate-900 underline-offset-4 hover:underline"
          >
            Przejdź do klientek
          </Link>
        </section>
      ) : null}
    </>
  );
}

function NewAppointmentFormSkeleton() {
  return (
    <section className="space-y-4 rounded-[28px] bg-white p-6 shadow-sm shadow-slate-200">
      <div className="h-5 w-40 animate-pulse rounded-full bg-slate-200" />
      <div className="h-12 w-full animate-pulse rounded-2xl bg-slate-100" />
      <div className="h-12 w-full animate-pulse rounded-2xl bg-slate-100" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
      </div>
      <div className="h-12 w-full animate-pulse rounded-2xl bg-slate-100" />
      <div className="h-12 w-full animate-pulse rounded-2xl bg-slate-100" />
      <div className="h-24 w-full animate-pulse rounded-2xl bg-slate-100" />
      <div className="h-28 w-full animate-pulse rounded-2xl bg-slate-100" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-12 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    </section>
  );
}
