"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function FloatingAddVisitButton() {
  const pathname = usePathname();

  if (pathname === "/planner") {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-5 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <Link
        href="/appointments/new"
        className="pointer-events-auto inline-flex w-full max-w-md items-center justify-center rounded-3xl bg-slate-950 px-5 py-4 text-center text-base font-semibold text-white shadow-lg shadow-slate-300 transition hover:bg-slate-800"
      >
        Dodaj wizytę
      </Link>
    </div>
  );
}
