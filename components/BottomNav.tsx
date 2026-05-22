import Link from "next/link";

export default function BottomNav() {
  return (
    <nav className="border-t border-slate-200 bg-white px-4 py-3">
      <div className="mx-auto flex max-w-md flex-wrap items-center justify-center gap-2">
        <Link
          href="/appointments"
          className="min-w-[72px] rounded-2xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Wizyty
        </Link>
        <Link
          href="/clients"
          className="min-w-[72px] rounded-2xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Klientki
        </Link>
        <Link
          href="/services"
          className="min-w-[72px] rounded-2xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Usługi
        </Link>
        <Link
          href="/money"
          className="min-w-[72px] rounded-2xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Pieniądze
        </Link>
        <Link
          href="/planner"
          className="min-w-[72px] rounded-2xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Planner
        </Link>
      </div>
    </nav>
  );
}
