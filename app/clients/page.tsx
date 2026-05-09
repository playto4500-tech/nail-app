import { createClientAction } from "../actions/clients";
import { getClients } from "../../lib/data/clients";
import { isSupabaseConfigured } from "../../lib/supabase/env";

export default async function ClientsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="bg-slate-50 px-5 py-8 text-slate-900">
        <main className="mx-auto max-w-md space-y-6">
          <section className="rounded-[28px] bg-white p-6 shadow-sm shadow-slate-200">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
              Klientki
            </p>
            <h1 className="mt-4 text-3xl font-semibold leading-tight text-slate-900">
              Najpierw skonfiguruj Supabase
            </h1>
            <p className="mt-3 text-slate-600">
              Po podłączeniu bazy klientki będą zapisywać się na stałe i będą dostępne
              także przy tworzeniu wizyty.
            </p>
          </section>
        </main>
      </div>
    );
  }

  const clients = await getClients();

  return (
    <div className="bg-slate-50 px-5 py-8 text-slate-900">
      <main className="mx-auto max-w-md space-y-6">
        <section className="rounded-[28px] bg-white p-6 shadow-sm shadow-slate-200">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
            Klientki
          </p>
          <h1 className="mt-4 text-3xl font-semibold leading-tight text-slate-900">
            Lista klientek
          </h1>
          <p className="mt-3 text-slate-600">
            Zobacz zapisane klientki i dodaj nowe wpisy do bazy.
          </p>
        </section>

        <section className="space-y-4">
          <div className="rounded-[24px] bg-white p-5 shadow-sm shadow-slate-200">
            <p className="text-sm text-slate-500">Zapisane klientki</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{clients.length}</p>
            <p className="mt-1 text-sm text-slate-500">
              Te same klientki można później wybierać przy dodawaniu wizyty.
            </p>
          </div>

          <form action={createClientAction} className="space-y-4 rounded-[24px] bg-white p-5 shadow-sm shadow-slate-200">
            <div>
              <p className="text-sm font-semibold text-slate-900">Dodaj klientkę</p>
              <p className="mt-1 text-sm text-slate-500">
                Instagram handle jest opcjonalny i zapisujemy go tylko wtedy, gdy naprawdę istnieje.
              </p>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Imię</span>
              <input
                name="name"
                type="text"
                required
                placeholder="Np. Anna Kowalska"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Instagram handle</span>
              <input
                name="instagramHandle"
                type="text"
                placeholder="Np. @anna.nails"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Status</span>
              <select
                name="status"
                defaultValue="new"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              >
                <option value="new">Nowa klientka</option>
                <option value="regular">Stała klientka</option>
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Uwagi</span>
              <textarea
                name="notes"
                rows={3}
                placeholder="Np. lubi krótkie paznokcie, woli naturalne kolory"
                className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
              />
            </label>

            <button
              type="submit"
              className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Dodaj klientkę
            </button>
          </form>

          {clients.map((client) => (
            <article key={client.id} className="rounded-[24px] bg-white p-5 shadow-sm shadow-slate-200">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{client.name}</p>
                  {client.instagramHandle ? (
                    <p className="mt-1 text-sm text-slate-500">{client.instagramHandle}</p>
                  ) : (
                    <p className="mt-1 text-sm text-slate-400">Brak Instagram handle</p>
                  )}
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {client.status === "regular" ? "Stała klientka" : "Nowa klientka"}
                </span>
              </div>

              {client.notes ? <p className="mt-4 text-sm text-slate-600">{client.notes}</p> : null}
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
