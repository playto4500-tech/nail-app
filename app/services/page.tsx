import { createServiceAction } from "../actions/services";
import { getServices } from "../../lib/data/services";
import { isSupabaseConfigured } from "../../lib/supabase/env";

function formatPrice(price: number) {
  return `${price} zł`;
}

export default async function ServicesPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="bg-slate-50 px-5 py-8 text-slate-900">
        <main className="mx-auto max-w-md space-y-6">
          <section className="rounded-[28px] bg-white p-6 shadow-sm shadow-slate-200">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
              Usługi
            </p>
            <h1 className="mt-4 text-3xl font-semibold leading-tight text-slate-900">
              Najpierw skonfiguruj Supabase
            </h1>
            <p className="mt-3 text-slate-600">
              Dodaj `.env.local` oraz uruchom SQL z `supabase/schema.sql`, a potem
              cennik zacznie działać z prawdziwej bazy.
            </p>
          </section>
        </main>
      </div>
    );
  }

  const services = await getServices();
  const serviceItems = services.filter((service) => service.category === "service");
  const addonItems = services.filter((service) => service.category === "addon");

  return (
    <div className="bg-slate-50 px-5 py-8 text-slate-900">
      <main className="mx-auto max-w-md space-y-6">
        <section className="rounded-[28px] bg-white p-6 shadow-sm shadow-slate-200">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
            Usługi
          </p>
          <h1 className="mt-4 text-3xl font-semibold leading-tight text-slate-900">
            Cennik usług
          </h1>
          <p className="mt-3 text-slate-600">
            Tutaj trzymasz wspólny cennik, z którego korzysta też formularz wizyty.
          </p>
        </section>

        <section className="space-y-4">
          <div className="rounded-[24px] bg-white p-5 shadow-sm shadow-slate-200">
            <p className="text-sm text-slate-500">Aktywne usługi</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{serviceItems.length}</p>
            <p className="mt-1 text-sm text-slate-500">Tylko te pozycje można wybrać przy dodawaniu wizyty.</p>
          </div>

          <form action={createServiceAction} className="space-y-4 rounded-[24px] bg-white p-5 shadow-sm shadow-slate-200">
            <div>
              <p className="text-sm font-semibold text-slate-900">Dodaj pozycję do cennika</p>
              <p className="mt-1 text-sm text-slate-500">
                Możesz dodać główną usługę albo dodatek. Dodatki są już w bazie, ale do wizyty podepniemy je później.
              </p>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Kategoria</span>
              <select
                name="category"
                defaultValue="service"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              >
                <option value="service">Usługa</option>
                <option value="addon">Dodatek</option>
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Nazwa</span>
              <input
                name="name"
                type="text"
                required
                placeholder="Np. Manicure japoński albo French"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Cena</span>
              <input
                name="price"
                type="number"
                min="1"
                required
                placeholder="Np. 150"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
              />
            </label>

            <button
              type="submit"
              className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Dodaj do cennika
            </button>
          </form>

          <section className="space-y-3 rounded-[24px] bg-white p-5 shadow-sm shadow-slate-200">
            <div>
              <p className="text-sm font-semibold text-slate-900">Usługi</p>
              <p className="mt-1 text-sm text-slate-500">Główne pozycje z cennika.</p>
            </div>

            {serviceItems.map((service) => (
              <div
                key={service.id}
                className="rounded-[20px] border border-slate-100 bg-slate-50 px-4 py-4"
              >
                <p className="text-sm text-slate-500">{service.name}</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {formatPrice(service.price)}
                </p>
              </div>
            ))}
          </section>

          <section className="space-y-3 rounded-[24px] bg-white p-5 shadow-sm shadow-slate-200">
            <div>
              <p className="text-sm font-semibold text-slate-900">Dodatki</p>
              <p className="mt-1 text-sm text-slate-500">
                Te pozycje są już zapisane w bazie, ale jeszcze nie są podpinane do wizyty.
              </p>
            </div>

            {addonItems.length > 0 ? (
              addonItems.map((addon) => (
                <div
                  key={addon.id}
                  className="rounded-[20px] border border-slate-100 bg-slate-50 px-4 py-4"
                >
                  <p className="text-sm text-slate-500">{addon.name}</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {formatPrice(addon.price)}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-sm text-slate-500">
                  Na razie nie ma jeszcze dodatków. Zostawiamy tu gotowe miejsce na kolejny krok.
                </p>
              </div>
            )}
          </section>
        </section>
      </main>
    </div>
  );
}
