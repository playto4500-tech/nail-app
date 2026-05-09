export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-5 py-10">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-20 w-20 animate-pulse items-center justify-center rounded-[28px] bg-slate-950 text-2xl font-bold text-white shadow-sm shadow-slate-300">
          NS
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
            Nail Studio Manager
          </p>
          <p className="text-base font-semibold text-slate-900">Ładowanie widoku...</p>
          <p className="text-sm text-slate-500">
            Zaraz pokażemy aktualne dane z aplikacji.
          </p>
        </div>
      </div>
    </div>
  );
}
