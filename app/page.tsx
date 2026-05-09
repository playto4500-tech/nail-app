export default function Home() {
  return (
    <div className="bg-slate-50 px-5 py-8 text-slate-900">
      <main className="mx-auto max-w-md space-y-6">
        <section className="px-1">
          <h1 className="text-3xl font-semibold leading-tight text-slate-900">Witaj Alina</h1>
        </section>

        <section className="grid gap-4">
          <div className="rounded-[24px] bg-white p-5 shadow-sm shadow-slate-200">
            <p className="text-sm text-slate-500">Dzisiejsze wizyty</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">4</p>
            <p className="mt-1 text-sm text-slate-500">Nowe paznokcie i korekty</p>
          </div>

          <div className="rounded-[24px] bg-white p-5 shadow-sm shadow-slate-200">
            <p className="text-sm text-slate-500">Zarobki w tym miesiącu</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">5 200 zł</p>
            <p className="mt-1 text-sm text-slate-500">Cel: 7 000 zł</p>
          </div>

          <div className="rounded-[24px] bg-white p-5 shadow-sm shadow-slate-200">
            <p className="text-sm text-slate-500">Nadchodząca wizyta</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">15:00 – Marta</p>
            <p className="mt-1 text-sm text-slate-500">Manicure hybrydowy</p>
          </div>
        </section>
      </main>
    </div>
  );
}
