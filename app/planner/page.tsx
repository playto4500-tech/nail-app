import { Suspense } from "react";
import { headers } from "next/headers";
import CalendarSubscriptionCard from "../../components/CalendarSubscriptionCard";
import PlannerExperience from "../../components/PlannerExperience";
import {
  getCalendarFeedToken,
  isCalendarFeedConfigured,
} from "../../lib/calendar/feed";
import { getAppointments } from "../../lib/data/appointments";
import { getClientSummaries } from "../../lib/data/clients";
import { getServices } from "../../lib/data/services";
import { isSupabaseConfigured } from "../../lib/supabase/env";

export default function PlannerPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="bg-slate-50 px-5 py-8 text-slate-900">
        <main className="mx-auto max-w-md space-y-6">
          <section className="rounded-[28px] bg-white p-6 shadow-sm shadow-slate-200">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
              Planner
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
      <main className="mx-auto max-w-md">
        <Suspense fallback={<PlannerSkeleton />}>
          <PlannerContent />
        </Suspense>
      </main>
    </div>
  );
}

async function PlannerContent() {
  const headersList = await headers();
  const [appointments, clients, services] = await Promise.all([
    getAppointments(),
    getClientSummaries(),
    getServices(),
  ]);
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host");
  const protoHeader = headersList.get("x-forwarded-proto");
  const protocol =
    protoHeader ?? (host?.includes("localhost") || host?.includes("127.0.0.1") ? "http" : "https");
  const feedUrl =
    host && isCalendarFeedConfigured()
      ? `${protocol}://${host}/api/calendar?token=${getCalendarFeedToken()}`
      : null;

  return (
    <div className="space-y-5">
      <PlannerExperience
        appointments={appointments}
        clients={clients}
        services={services}
      />
      <CalendarSubscriptionCard
        feedUrl={feedUrl}
        tokenConfigured={isCalendarFeedConfigured()}
      />
    </div>
  );
}

function PlannerSkeleton() {
  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="h-11 w-11 animate-pulse rounded-2xl bg-white shadow-sm shadow-slate-200" />
        <div className="space-y-2 text-center">
          <div className="mx-auto h-3 w-20 animate-pulse rounded-full bg-slate-200" />
          <div className="mx-auto h-7 w-40 animate-pulse rounded-full bg-slate-200" />
        </div>
        <div className="h-11 w-11 animate-pulse rounded-2xl bg-white shadow-sm shadow-slate-200" />
      </div>
      <div className="h-14 animate-pulse rounded-[24px] bg-white shadow-sm shadow-slate-200" />
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }, (_, index) => (
          <div
            key={index}
            className="h-[72px] animate-pulse rounded-[22px] bg-white shadow-sm shadow-slate-100"
          />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-[28px] bg-white shadow-sm shadow-slate-200" />
    </section>
  );
}
