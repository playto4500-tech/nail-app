"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function FloatingAddVisitButton() {
  const pathname = usePathname();

  if (pathname === "/planner" || pathname === "/appointments/new") {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-end px-5 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <Link
        href="/appointments/new"
        scroll={false}
        className="pointer-events-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 text-white shadow-lg shadow-slate-300 transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
        aria-label="Dodaj wizytę"
        title="Dodaj wizytę"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.4"
        >
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      </Link>
    </div>
  );
}
