"use client";

import { useState } from "react";
import ExpensesExperience from "./ExpensesExperience";
import type {
  FinancePeriodSummary,
  FinanceSummary,
  MonthlyFinanceSummary,
} from "../lib/data/finances";
import { formatPrice } from "../lib/ui/format";

type Props = {
  summary: FinanceSummary;
};

type RangeKey = "today" | "week" | "month" | "year";

const rangeOptions: Array<{ key: RangeKey; label: string }> = [
  { key: "today", label: "Dzisiaj" },
  { key: "week", label: "Tydzień" },
  { key: "month", label: "Miesiąc" },
  { key: "year", label: "Rok" },
];

function MetricTile({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  tone?: "neutral" | "good" | "bad";
}) {
  const valueClassName =
    tone === "good"
      ? "text-emerald-700"
      : tone === "bad"
        ? "text-rose-700"
        : "text-slate-950";

  return (
    <div className="rounded-2xl bg-slate-50 px-3 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-base font-semibold ${valueClassName}`}>{value}</p>
    </div>
  );
}

function SelectedRangeSummary({ summary }: { summary: FinancePeriodSummary }) {
  return (
    <section className="rounded-[24px] bg-white p-5 shadow-sm shadow-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{summary.label}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">
            {formatPrice(summary.profit)}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            summary.profit >= 0
              ? "bg-emerald-100 text-emerald-700"
              : "bg-rose-100 text-rose-700"
          }`}
        >
          Netto
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <MetricTile label="Przychód" value={formatPrice(summary.income)} tone="good" />
        <MetricTile label="Wydatki" value={formatPrice(summary.expenses)} tone="bad" />
        <MetricTile label="Wizyty" value={summary.appointmentCount} />
        <MetricTile
          label="Średnio / wizyta"
          value={formatPrice(summary.averageAppointmentIncome)}
        />
        <MetricTile label="Tipy" value={formatPrice(summary.tipTotal)} />
        <MetricTile label="Średni tip" value={formatPrice(summary.averageTip)} />
      </div>

      <div className="mt-3 rounded-2xl bg-slate-50 px-3 py-3">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-slate-500">Wizyty z tipem</span>
          <span className="font-semibold text-slate-900">
            {summary.tippedAppointmentCount} / {summary.appointmentCount}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
          <div
            className="h-full rounded-full bg-emerald-500"
            style={{ width: `${summary.tipRate}%` }}
          />
        </div>
      </div>
    </section>
  );
}

function ProjectedEarningsCard({ summary }: { summary: FinanceSummary["projected"] }) {
  return (
    <section className="rounded-[24px] bg-white p-5 shadow-sm shadow-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Prognoza</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">
            {formatPrice(summary.estimatedIncome)}
          </p>
        </div>
        <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700">
          Szacunek
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <MetricTile label="Przyszłe wizyty" value={summary.upcomingAppointmentCount} />
        <MetricTile
          label="Średnia 30 dni"
          value={formatPrice(summary.averageIncomeLast30Days)}
        />
      </div>
    </section>
  );
}

function MonthBars({ months }: { months: MonthlyFinanceSummary[] }) {
  const chronologicalMonths = [...months].reverse();
  const maxValue = Math.max(
    1,
    ...chronologicalMonths.map((month) =>
      Math.max(month.income, month.expenses, Math.abs(month.profit)),
    ),
  );

  return (
    <section className="space-y-4 rounded-[24px] bg-white p-5 shadow-sm shadow-slate-200">
      <p className="text-sm font-semibold text-slate-900">Trend miesięczny</p>

      <div className="space-y-4">
        {chronologicalMonths.map((month) => {
          const incomeWidth = Math.max(2, Math.round((month.income / maxValue) * 100));
          const expenseWidth = Math.max(
            2,
            Math.round((month.expenses / maxValue) * 100),
          );
          const profitWidth = Math.max(
            2,
            Math.round((Math.abs(month.profit) / maxValue) * 100),
          );

          return (
            <div key={month.monthKey} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-slate-700">{month.label}</p>
                <p
                  className={`text-xs font-semibold ${
                    month.profit >= 0 ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {formatPrice(month.profit)}
                </p>
              </div>
              <div className="space-y-1.5">
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${incomeWidth}%` }}
                  />
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-rose-400"
                    style={{ width: `${expenseWidth}%` }}
                  />
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${
                      month.profit >= 0 ? "bg-slate-900" : "bg-amber-500"
                    }`}
                    style={{ width: `${profitWidth}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
          Przychód
        </span>
        <span className="rounded-full bg-rose-50 px-3 py-1 text-rose-700">
          Wydatki
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
          Netto
        </span>
      </div>
    </section>
  );
}

function MonthlyDetails({ months }: { months: MonthlyFinanceSummary[] }) {
  return (
    <section className="space-y-3 rounded-[24px] bg-white p-5 shadow-sm shadow-slate-200">
      <p className="text-sm font-semibold text-slate-900">Miesiąc po miesiącu</p>

      <div className="space-y-2">
        {months.map((month) => (
          <div
            key={month.monthKey}
            className="rounded-[20px] border border-slate-100 bg-slate-50 px-4 py-4"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-slate-900">{month.label}</p>
              <p
                className={`text-sm font-semibold ${
                  month.profit >= 0 ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                {formatPrice(month.profit)}
              </p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-500">
              <p>
                Przychód:{" "}
                <span className="font-semibold text-slate-900">
                  {formatPrice(month.income)}
                </span>
              </p>
              <p>
                Wydatki:{" "}
                <span className="font-semibold text-slate-900">
                  {formatPrice(month.expenses)}
                </span>
              </p>
              <p>
                Wizyty:{" "}
                <span className="font-semibold text-slate-900">
                  {month.appointmentCount}
                </span>
              </p>
              <p>
                Średnio:{" "}
                <span className="font-semibold text-slate-900">
                  {formatPrice(month.averageAppointmentIncome)}
                </span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function MoneyExperience({ summary }: Props) {
  const [selectedRange, setSelectedRange] = useState<RangeKey>("month");
  const selectedSummary = summary[selectedRange];

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-4 gap-1 rounded-[24px] border border-slate-200 bg-white p-1 shadow-sm shadow-slate-200">
        {rangeOptions.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setSelectedRange(option.key)}
            className={`rounded-[18px] px-2 py-3 text-xs font-semibold transition ${
              selectedRange === option.key
                ? "bg-slate-950 text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <SelectedRangeSummary summary={selectedSummary} />
      <ProjectedEarningsCard summary={summary.projected} />
      <MonthBars months={summary.months} />
      <ExpensesExperience recentExpenses={summary.recentExpenses} />
      <MonthlyDetails months={summary.months} />
    </section>
  );
}
