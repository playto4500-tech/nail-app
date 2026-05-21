"use client";

import { useState } from "react";

type Props = {
  feedUrl: null | string;
  tokenConfigured: boolean;
};

export default function CalendarSubscriptionCard({
  feedUrl,
  tokenConfigured,
}: Props) {
  const [copyFeedback, setCopyFeedback] = useState("");
  const webcalUrl = feedUrl
    ? feedUrl.replace(/^https:\/\//, "webcal://").replace(/^http:\/\//, "webcal://")
    : null;

  async function handleCopyLink() {
    if (!feedUrl) {
      return;
    }

    await navigator.clipboard.writeText(feedUrl);
    setCopyFeedback("Skopiowano link");
    window.setTimeout(() => setCopyFeedback(""), 2500);
  }

  return (
    <section className="rounded-[28px] bg-white p-5 shadow-sm shadow-slate-200">
      <div>
        <p className="text-sm font-semibold text-slate-900">Kalendarz iPhone</p>
        <p className="mt-1 text-sm text-slate-500">
          Możesz zasubskrybować wizyty w systemowym kalendarzu iPhone&apos;a.
        </p>
      </div>

      {tokenConfigured && feedUrl ? (
        <>
          <div className="mt-4 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
              Link subskrypcji
            </p>
            <p className="mt-2 break-all text-sm font-medium text-slate-900">{feedUrl}</p>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <a
              href={webcalUrl ?? "#"}
              className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Dodaj do Kalendarza
            </a>

            <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Kopiuj link
            </button>
            <a
              href={feedUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Otwórz feed
            </a>
            </div>
          </div>

          {copyFeedback ? (
            <p className="mt-3 text-sm font-medium text-emerald-700">{copyFeedback}</p>
          ) : null}

          <div className="mt-5 space-y-3 rounded-[22px] border border-slate-100 bg-slate-50 px-4 py-4">
            <p className="text-sm font-semibold text-slate-900">Jak dodać na iPhonie</p>
            <ol className="space-y-2 text-sm text-slate-600">
              <li>1. Najpierw kliknij `Dodaj do Kalendarza`.</li>
              <li>2. Jeśli iPhone nie otworzy subskrypcji od razu, kliknij `Kopiuj link`.</li>
              <li>3. Na iPhonie wejdź w `Ustawienia` → `Aplikacje` → `Kalendarz`.</li>
              <li>4. Otwórz `Konta` → `Dodaj konto` → `Inne`.</li>
              <li>5. Wybierz `Dodaj subskrybowany kalendarz` i wklej link.</li>
            </ol>
          </div>
        </>
      ) : (
        <div className="mt-4 rounded-[22px] border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
          Najpierw ustaw `CALENDAR_FEED_TOKEN` w `.env.local` i na Vercelu. Bez tego
          nie da się wygenerować prywatnego linku do subskrypcji.
        </div>
      )}
    </section>
  );
}
