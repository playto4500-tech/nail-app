"use client";

import { useRouter } from "next/navigation";
import { useBodyScrollLock } from "../lib/hooks/useBodyScrollLock";

type Props = {
  children: React.ReactNode;
  title: string;
  eyebrow?: string;
};

export default function AppRouteModal({ children, title, eyebrow }: Props) {
  const router = useRouter();
  useBodyScrollLock(true);

  function closeModal() {
    router.back();
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/40 p-4 backdrop-blur-[2px] sm:items-center">
      <button
        type="button"
        onClick={closeModal}
        className="absolute inset-0"
        aria-label="Zamknij okno dodawania wizyty"
      />

      <section className="relative z-10 max-h-[85vh] w-full max-w-md overflow-y-auto rounded-[28px] bg-white p-6 shadow-xl shadow-slate-300">
        <div className="flex items-start justify-between gap-4">
          <div>
            {eyebrow ? (
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                {eyebrow}
              </p>
            ) : null}
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">{title}</h2>
          </div>

          <button
            type="button"
            onClick={closeModal}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100"
            aria-label="Zamknij"
          >
            ✕
          </button>
        </div>

        <div className="mt-6">{children}</div>
      </section>
    </div>
  );
}
