export default function MoneyPage() {
  return (
    <div className="bg-slate-50 px-5 py-8 text-slate-900">
      <main className="mx-auto max-w-md space-y-6">
        <section className="rounded-[28px] bg-white p-6 shadow-sm shadow-slate-200">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
            Pieniądze
          </p>
          <h1 className="mt-4 text-3xl font-semibold leading-tight text-slate-900">
            Podsumowanie finansów
          </h1>
          <p className="mt-3 text-slate-600">
            Kontroluj zarobki i wydatki salonu w prosty sposób.
          </p>
        </section>

        <section className="space-y-4">
          <div className="rounded-[24px] bg-white p-5 shadow-sm shadow-slate-200">
            <p className="text-sm text-slate-500">Przychód w tym miesiącu</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">5 200 zł</p>
          </div>

          <div className="rounded-[24px] bg-white p-5 shadow-sm shadow-slate-200">
            <p className="text-sm text-slate-500">Wydatki salonu</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">1 100 zł</p>
          </div>

          <div className="rounded-[24px] bg-white p-5 shadow-sm shadow-slate-200">
            <p className="text-sm text-slate-500">Zysk netto</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">4 100 zł</p>
          </div>
        </section>
      </main>
    </div>
  );
}
