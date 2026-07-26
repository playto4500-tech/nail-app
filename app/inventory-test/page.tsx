export default function InventoryTestPage() {
  return (
    <div className="bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <main className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.08em] text-blue-700 ring-1 ring-blue-100">
              TEST
            </span>
            <span className="rounded-md bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
              Zasoby
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">
            Zasoby TEST
          </h1>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Produkty", value: "0", tone: "bg-blue-50 text-blue-700 ring-blue-100" },
            { label: "Niski stan", value: "0", tone: "bg-amber-50 text-amber-700 ring-amber-100" },
            { label: "Do zamówienia", value: "0", tone: "bg-rose-50 text-rose-700 ring-rose-100" },
          ].map((item) => (
            <section
              key={item.label}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">{item.label}</p>
                  <p className="mt-2 text-2xl font-bold text-slate-950">{item.value}</p>
                </div>
                <span className={`h-10 w-10 rounded-lg ring-1 ${item.tone}`} aria-hidden="true" />
              </div>
            </section>
          ))}
        </section>

        <section className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-sm font-medium text-slate-500 shadow-sm">
          Moduł w przygotowaniu.
        </section>
      </main>
    </div>
  );
}
