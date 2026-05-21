"use client";

type Props = {
  feedUrl: null | string;
  tokenConfigured: boolean;
};

export default function CalendarSubscriptionCard({
  feedUrl,
  tokenConfigured,
}: Props) {
  const webcalUrl = feedUrl
    ? feedUrl.replace(/^https:\/\//, "webcal://").replace(/^http:\/\//, "webcal://")
    : null;

  return (
    <section>
      <a
        href={tokenConfigured && webcalUrl ? webcalUrl : "#"}
        aria-disabled={!tokenConfigured || !webcalUrl}
        className={`block w-full rounded-[24px] px-4 py-4 text-center text-sm font-semibold transition ${
          tokenConfigured && webcalUrl
            ? "bg-slate-950 text-white hover:bg-slate-800"
            : "pointer-events-none bg-slate-200 text-slate-500"
        }`}
      >
        DODAJ DO KALENDARZA
      </a>
    </section>
  );
}
