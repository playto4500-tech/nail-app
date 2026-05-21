import ServicesExperience from "../../components/ServicesExperience";
import { getServices } from "../../lib/data/services";
import { isSupabaseConfigured } from "../../lib/supabase/env";

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
            To jest tylko podgląd cennika. Wykonaną usługę przypisujesz dopiero przy zakończeniu wizyty.
          </p>
        </section>

        <section className="space-y-4">
          <div className="rounded-[24px] bg-white p-5 shadow-sm shadow-slate-200">
            <p className="text-sm text-slate-500">Aktywne usługi</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{serviceItems.length}</p>
            <p className="mt-1 text-sm text-slate-500">
              Te pozycje wybierzesz dopiero po zakończonej wizycie.
            </p>
          </div>

          <section className="space-y-3 rounded-[24px] bg-white p-5 shadow-sm shadow-slate-200">
            <div>
              <p className="text-sm font-semibold text-slate-900">Usługi</p>
              <p className="mt-1 text-sm text-slate-500">Główne pozycje z cennika.</p>
            </div>

            <ServicesExperience services={serviceItems} />
          </section>

          <section className="space-y-3 rounded-[24px] bg-white p-5 shadow-sm shadow-slate-200">
            <div>
              <p className="text-sm font-semibold text-slate-900">Dodatki</p>
              <p className="mt-1 text-sm text-slate-500">
                Zostawiamy je tylko jako podgląd cennika.
              </p>
            </div>

            {addonItems.length > 0 ? (
              <ServicesExperience services={addonItems} />
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
