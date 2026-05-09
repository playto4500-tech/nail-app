import { Suspense } from "react";
import { getAppointments } from "../../lib/data/appointments";
import { isSupabaseConfigured } from "../../lib/supabase/env";

function formatAppointmentDate(date: string) {
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(date));
}

function formatPrice(price: number) {
  return `${price} zł`;
}

function getAppointmentTotal(price: number, addons: Array<{ price: number }>) {
  return price + addons.reduce((total, addon) => total + addon.price, 0);
}

function getStatusLabel(status: "confirmed" | "cancelled" | "past") {
  if (status === "confirmed") {
    return "Potwierdzona";
  }

  if (status === "cancelled") {
    return "Anulowana";
  }

  return "Zakończona";
}

function getStatusClasses(status: "confirmed" | "cancelled" | "past") {
  if (status === "confirmed") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "cancelled") {
    return "bg-rose-100 text-rose-700";
  }

  return "bg-slate-200 text-slate-700";
}

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
  const appointments = await getAppointments();

  return (
    <section className="space-y-4">
      <div className="rounded-[24px] bg-white p-5 shadow-sm shadow-slate-200">
        <p className="text-sm text-slate-500">Zaplanowane wizyty</p>
        <p className="mt-2 text-2xl font-semibold text-slate-900">{appointments.length}</p>
        <p className="mt-1 text-sm text-slate-500">
          Nowe wizyty pojawią się tutaj od razu po zapisaniu.
        </p>
      </div>

      {appointments.map((appointment) => (
        <article
          key={appointment.id}
          className="rounded-[24px] bg-white p-5 shadow-sm shadow-slate-200"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">
                {formatAppointmentDate(appointment.date)} — {appointment.time}
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {appointment.clientName}
              </p>
              {appointment.clientInstagramHandle ? (
                <p className="mt-1 text-sm text-slate-500">
                  {appointment.clientInstagramHandle}
                </p>
              ) : null}
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(appointment.status)}`}
            >
              {getStatusLabel(appointment.status)}
            </span>
          </div>

          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <p>
              Usługa:{" "}
              <span className="font-medium text-slate-900">{appointment.serviceName}</span>
            </p>
            <p>
              Cena:{" "}
              <span className="font-medium text-slate-900">
                {formatPrice(getAppointmentTotal(appointment.price, appointment.addons))}
              </span>
            </p>
            <p>
              Status klientki:{" "}
              <span className="font-medium text-slate-900">
                {appointment.clientStatus === "regular" ? "Stała klientka" : "Nowa klientka"}
              </span>
            </p>
            {appointment.addons.length > 0 ? (
              <div>
                <p>
                  Dodatki:{" "}
                  <span className="font-medium text-slate-900">
                    {appointment.addons
                      .map((addon) => `${addon.name} (+${formatPrice(addon.price)})`)
                      .join(", ")}
                  </span>
                </p>
              </div>
            ) : null}
          </div>
          {appointment.notes ? (
            <p className="mt-3 text-sm text-slate-500">{appointment.notes}</p>
          ) : null}
        </article>
      ))}
    </section>
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
