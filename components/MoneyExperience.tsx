"use client";

import { useState } from "react";
import ExpensesExperience from "./ExpensesExperience";
import type {
  CompletedAppointmentIncome,
  ExpenseAmountItem,
  FinanceProjectionSummary,
  FinanceSummary,
} from "../lib/data/finances";
import { formatNumericDate, formatPrice } from "../lib/ui/format";

type Props = {
  summary: FinanceSummary;
};

type RangeKey = "today" | "week" | "month" | "year";
type VisitsTrendMode = "month" | "week";

type FinancePeriodSummary = {
  title: string;
  dateLabel: string;
  income: number;
  expenses: number;
  profit: number;
  appointmentCount: number;
  averageAppointmentIncome: number;
  tipTotal: number;
  averageProfitPerAppointment: number;
};

type TrendPoint = {
  key: string;
  label: string;
  value: number;
};

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
      ? "text-emerald-300"
      : tone === "bad"
        ? "text-rose-300"
        : "text-white";

  return (
    <div className="rounded-[22px] border border-white/10 bg-white/8 px-3 py-3 backdrop-blur-sm">
      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-300">{label}</p>
      <p className={`mt-1 text-base font-semibold ${valueClassName}`}>{value}</p>
    </div>
  );
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1, 12);
}

function addYears(date: Date, years: number) {
  return new Date(date.getFullYear() + years, 0, 1, 12);
}

function getStartOfWeek(date: Date) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  return start;
}

function getMonthLabel(date: Date) {
  const label = new Intl.DateTimeFormat("pl-PL", {
    month: "long",
    year: "numeric",
  }).format(date);

  return label.charAt(0).toUpperCase() + label.slice(1);
}

function getMonthShortLabel(date: Date) {
  const label = new Intl.DateTimeFormat("pl-PL", {
    month: "short",
    year: "2-digit",
  }).format(date);

  return label.replace(".", "");
}

function formatRangeLabel(from: string, to: string) {
  if (from === to) {
    return formatNumericDate(from);
  }

  const fromDate = parseDateKey(from);
  const toDate = parseDateKey(to);
  const shortFormatter = new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
  });

  if (fromDate.getFullYear() === toDate.getFullYear()) {
    return `${shortFormatter.format(fromDate)} - ${formatNumericDate(to)}`;
  }

  return `${formatNumericDate(from)} - ${formatNumericDate(to)}`;
}

function getRangeOffsetLabel(offset: number) {
  if (offset === 0) {
    return "Bieżący zakres";
  }

  if (offset < 0) {
    return offset === -1 ? "Poprzedni zakres" : `${Math.abs(offset)} zakresy wstecz`;
  }

  return offset === 1 ? "Następny zakres" : `${offset} zakresy do przodu`;
}

function sumInRange<T extends { date: string; amount: number }>(
  items: T[],
  from: string,
  to: string,
) {
  return items.reduce((total, item) => {
    if (item.date < from || item.date > to) {
      return total;
    }

    return total + item.amount;
  }, 0);
}

function countAppointmentsInRange(
  appointments: CompletedAppointmentIncome[],
  from: string,
  to: string,
) {
  return appointments.filter((appointment) => appointment.date >= from && appointment.date <= to)
    .length;
}

function createPeriodSummary(
  title: string,
  dateLabel: string,
  incomes: CompletedAppointmentIncome[],
  expenses: ExpenseAmountItem[],
  from: string,
  to: string,
): FinancePeriodSummary {
  const periodAppointments = incomes.filter(
    (appointment) => appointment.date >= from && appointment.date <= to,
  );
  const income = periodAppointments.reduce((total, appointment) => total + appointment.amount, 0);
  const expenseTotal = sumInRange(expenses, from, to);
  const appointmentCount = periodAppointments.length;
  const tipTotal = periodAppointments.reduce((total, appointment) => total + appointment.tip, 0);

  return {
    title,
    dateLabel,
    income,
    expenses: expenseTotal,
    profit: income - expenseTotal,
    appointmentCount,
    averageAppointmentIncome:
      appointmentCount > 0 ? Math.round(income / appointmentCount) : 0,
    tipTotal,
    averageProfitPerAppointment:
      appointmentCount > 0 ? Math.round((income - expenseTotal) / appointmentCount) : 0,
  };
}

function getSelectedRangeSummary(
  todayKey: string,
  rangeKey: RangeKey,
  offset: number,
  incomes: CompletedAppointmentIncome[],
  expenses: ExpenseAmountItem[],
) {
  const today = parseDateKey(todayKey);

  if (rangeKey === "today") {
    const selectedDate = addDays(today, offset);
    const dateKey = toDateKey(selectedDate);

    return createPeriodSummary(
      "Dzień",
      formatNumericDate(dateKey),
      incomes,
      expenses,
      dateKey,
      dateKey,
    );
  }

  if (rangeKey === "week") {
    const startOfWeek = addDays(getStartOfWeek(today), offset * 7);
    const endOfWeek = addDays(startOfWeek, 6);

    return createPeriodSummary(
      "Tydzień",
      formatRangeLabel(toDateKey(startOfWeek), toDateKey(endOfWeek)),
      incomes,
      expenses,
      toDateKey(startOfWeek),
      toDateKey(endOfWeek),
    );
  }

  if (rangeKey === "month") {
    const monthDate = addMonths(new Date(today.getFullYear(), today.getMonth(), 1, 12), offset);
    const from = toDateKey(monthDate);
    const to = toDateKey(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 12));

    return createPeriodSummary(
      "Miesiąc",
      getMonthLabel(monthDate),
      incomes,
      expenses,
      from,
      to,
    );
  }

  const yearDate = addYears(new Date(today.getFullYear(), 0, 1, 12), offset);
  const from = toDateKey(yearDate);
  const to = toDateKey(new Date(yearDate.getFullYear(), 11, 31, 12));

  return createPeriodSummary(
    "Rok",
    String(yearDate.getFullYear()),
    incomes,
    expenses,
    from,
    to,
  );
}

function buildMonthlyNetTrend(
  todayKey: string,
  incomes: CompletedAppointmentIncome[],
  expenses: ExpenseAmountItem[],
) {
  const today = parseDateKey(todayKey);

  return Array.from({ length: 12 }, (_, index) => {
    const monthDate = addMonths(new Date(today.getFullYear(), today.getMonth(), 1, 12), index - 11);
    const from = toDateKey(monthDate);
    const to = toDateKey(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 12));
    const income = sumInRange(incomes, from, to);
    const expenseTotal = sumInRange(expenses, from, to);

    return {
      key: `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`,
      label: getMonthShortLabel(monthDate),
      value: income - expenseTotal,
    };
  });
}

function buildVisitsTrend(
  todayKey: string,
  mode: VisitsTrendMode,
  appointments: CompletedAppointmentIncome[],
) {
  const today = parseDateKey(todayKey);

  if (mode === "month") {
    return Array.from({ length: 12 }, (_, index) => {
      const monthDate = addMonths(new Date(today.getFullYear(), today.getMonth(), 1, 12), index - 11);
      const from = toDateKey(monthDate);
      const to = toDateKey(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 12));

      return {
        key: `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`,
        label: getMonthShortLabel(monthDate),
        value: countAppointmentsInRange(appointments, from, to),
      };
    });
  }

  return Array.from({ length: 12 }, (_, index) => {
    const startOfWeek = addDays(getStartOfWeek(today), (index - 11) * 7);
    const endOfWeek = addDays(startOfWeek, 6);
    const from = toDateKey(startOfWeek);
    const to = toDateKey(endOfWeek);

    return {
      key: from,
      label: new Intl.DateTimeFormat("pl-PL", {
        day: "2-digit",
        month: "2-digit",
      }).format(startOfWeek),
      value: countAppointmentsInRange(appointments, from, to),
    };
  });
}

function SelectedRangeSummary({ summary }: { summary: FinancePeriodSummary }) {
  return (
    <section className="overflow-hidden rounded-[30px] bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_34%),linear-gradient(180deg,_#0f172a_0%,_#172033_100%)] p-5 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.7)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
            {summary.title}
          </p>
          <p className="mt-2 text-sm text-slate-300">{summary.dateLabel}</p>
          <p className="mt-4 text-4xl font-semibold text-white">
            {formatPrice(summary.profit)}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            summary.profit >= 0
              ? "bg-emerald-400/15 text-emerald-200"
              : "bg-rose-400/15 text-rose-200"
          }`}
        >
          Netto
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <MetricTile label="Przychód" value={formatPrice(summary.income)} tone="good" />
        <MetricTile label="Wydatki" value={formatPrice(summary.expenses)} tone="bad" />
        <MetricTile label="Wizyty" value={summary.appointmentCount} />
        <MetricTile
          label="Średni koszt wizyty"
          value={formatPrice(summary.averageAppointmentIncome)}
        />
        <MetricTile label="Tipy" value={formatPrice(summary.tipTotal)} />
        <MetricTile
          label="Netto / wizyta"
          value={formatPrice(summary.averageProfitPerAppointment)}
        />
      </div>
    </section>
  );
}

function ProjectionRow({
  item,
  maxTotal,
  averageIncomeLastMonth,
}: {
  item: FinanceProjectionSummary;
  maxTotal: number;
  averageIncomeLastMonth: number;
}) {
  const earnedWidth = item.totalIncome > 0 ? (item.earnedIncome / maxTotal) * 100 : 0;
  const projectedWidth =
    item.totalIncome > 0 ? (item.projectedIncome / maxTotal) * 100 : 0;
  const hasEarnedValue = item.earnedIncome > 0;
  const showEarnedMetric = item.mode === "mixed";

  return (
    <article className="overflow-hidden rounded-[26px] border border-white/12 bg-white/8 px-4 py-4 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{item.label}</p>
          <p className="mt-1 text-xs text-slate-300">{formatRangeLabel(item.from, item.to)}</p>
        </div>
        <div className="rounded-full bg-white/10 px-3 py-1 text-right">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-300">Razem</p>
          <p className="text-sm font-semibold text-white">{formatPrice(item.totalIncome)}</p>
        </div>
      </div>

      <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
        <div className="flex h-full">
          {hasEarnedValue ? (
            <div
              className="h-full rounded-l-full bg-emerald-300"
              style={{ width: `${earnedWidth}%` }}
            />
          ) : null}
          {item.projectedIncome > 0 ? (
            <div
              className={`h-full ${hasEarnedValue ? "rounded-r-full" : "rounded-full"} bg-sky-300`}
              style={{ width: `${projectedWidth}%` }}
            />
          ) : null}
        </div>
      </div>

      <div
        className={`mt-4 grid gap-3 text-xs ${
          showEarnedMetric ? "grid-cols-2" : "grid-cols-1"
        }`}
      >
        {showEarnedMetric ? (
          <div className="rounded-2xl bg-black/15 px-3 py-3 text-slate-200">
            <p className="uppercase tracking-[0.16em] text-slate-400">Zarobione</p>
            <p className="mt-1 text-sm font-semibold text-white">
              {formatPrice(item.earnedIncome)}
            </p>
          </div>
        ) : null}
        <div className="rounded-2xl bg-black/15 px-3 py-3 text-slate-200">
          <p className="uppercase tracking-[0.16em] text-slate-400">Szacowane</p>
          <p className="mt-1 text-sm font-semibold text-white">
            {formatPrice(item.projectedIncome)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-300">
        <span>{item.projectedAppointmentCount} zaplanowanych wizyt</span>
        <span>Śr. z miesiąca: {formatPrice(averageIncomeLastMonth)}</span>
      </div>
    </article>
  );
}

function ProjectedEarningsCard({ projected }: { projected: FinanceSummary["projected"] }) {
  const items = [projected.currentWeek, projected.nextWeek, projected.currentMonth];
  const maxTotal = Math.max(1, ...items.map((item) => item.totalIncome));

  return (
    <section className="overflow-hidden rounded-[30px] bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.2),_transparent_30%),linear-gradient(180deg,_#111827_0%,_#182235_100%)] p-5 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.8)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
            Prognoza
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Plan przychodów</h2>
        </div>
        <div className="rounded-[22px] border border-white/10 bg-white/8 px-4 py-3 text-right backdrop-blur-sm">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-300">
            Średnia wizyta
          </p>
          <p className="mt-1 text-xl font-semibold text-white">
            {formatPrice(projected.averageIncomeLastMonth)}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <ProjectionRow
            key={item.label}
            item={item}
            maxTotal={maxTotal}
            averageIncomeLastMonth={projected.averageIncomeLastMonth}
          />
        ))}
      </div>
    </section>
  );
}

function TrendRows({
  points,
  formatter,
  positiveColorClass,
  negativeColorClass,
}: {
  points: TrendPoint[];
  formatter: (value: number) => string;
  positiveColorClass: string;
  negativeColorClass?: string;
}) {
  const maxValue = Math.max(1, ...points.map((point) => Math.abs(point.value)));

  return (
    <div className="space-y-3">
      {points.map((point) => {
        const barWidth =
          point.value === 0 ? 0 : Math.max(6, (Math.abs(point.value) / maxValue) * 100);
        const barClassName =
          point.value >= 0 ? positiveColorClass : negativeColorClass ?? positiveColorClass;

        return (
          <div
            key={point.key}
            className="rounded-[22px] border border-slate-200/80 bg-white/80 px-4 py-3 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {point.label}
              </p>
              <p
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  point.value >= 0
                    ? "bg-emerald-50 text-slate-900"
                    : "bg-rose-50 text-rose-700"
                }`}
              >
                {formatter(point.value)}
              </p>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
              {point.value !== 0 ? (
                <div
                  className={`h-full rounded-full ${barClassName}`}
                  style={{ width: `${barWidth}%` }}
                />
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TrendBars({
  title,
  points,
  formatter,
  positiveColorClass,
  negativeColorClass,
}: {
  title: string;
  points: TrendPoint[];
  formatter: (value: number) => string;
  positiveColorClass: string;
  negativeColorClass?: string;
}) {
  return (
    <section className="space-y-4 rounded-[30px] border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,1),_rgba(248,250,252,1)_50%,_rgba(226,232,240,0.55)_100%)] p-5 shadow-[0_20px_60px_-32px_rgba(15,23,42,0.3)]">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
        {title}
      </p>
      <TrendRows
        points={points}
        formatter={formatter}
        positiveColorClass={positiveColorClass}
        negativeColorClass={negativeColorClass}
      />
    </section>
  );
}

export default function MoneyExperience({ summary }: Props) {
  const [selectedRange, setSelectedRange] = useState<RangeKey>("month");
  const [rangeOffset, setRangeOffset] = useState(0);
  const [visitsTrendMode, setVisitsTrendMode] = useState<VisitsTrendMode>("month");

  const selectedSummary = getSelectedRangeSummary(
    summary.todayKey,
    selectedRange,
    rangeOffset,
    summary.completedAppointments,
    summary.expenseItems,
  );
  const monthlyNetTrend = buildMonthlyNetTrend(
    summary.todayKey,
    summary.completedAppointments,
    summary.expenseItems,
  );
  const visitsTrend = buildVisitsTrend(
    summary.todayKey,
    visitsTrendMode,
    summary.completedAppointments,
  );

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-4 gap-1 rounded-[24px] border border-slate-200 bg-white p-1 shadow-sm shadow-slate-200">
        {rangeOptions.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => {
              setSelectedRange(option.key);
              setRangeOffset(0);
            }}
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

      <section className="flex items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-white px-4 py-3 shadow-sm shadow-slate-200">
        <button
          type="button"
          onClick={() => setRangeOffset((currentOffset) => currentOffset - 1)}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-xl text-slate-700 transition hover:bg-slate-100"
          aria-label="Pokaż wcześniejszy zakres"
        >
          ‹
        </button>

        <div className="min-w-0 text-center">
          <p className="text-sm font-semibold text-slate-900">{selectedSummary.dateLabel}</p>
          <p className="mt-1 text-xs text-slate-500">{getRangeOffsetLabel(rangeOffset)}</p>
        </div>

        <button
          type="button"
          onClick={() => setRangeOffset((currentOffset) => currentOffset + 1)}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-xl text-slate-700 transition hover:bg-slate-100"
          aria-label="Pokaż nowszy zakres"
        >
          ›
        </button>
      </section>

      <SelectedRangeSummary summary={selectedSummary} />
      <ProjectedEarningsCard projected={summary.projected} />
      <TrendBars
        title="Netto miesiąc po miesiącu"
        points={monthlyNetTrend}
        formatter={(value) => formatPrice(value)}
        positiveColorClass="bg-emerald-500"
        negativeColorClass="bg-rose-400"
      />

      <section className="space-y-4 rounded-[30px] border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(224,242,254,0.65),_rgba(255,255,255,1)_55%)] p-5 shadow-[0_20px_60px_-32px_rgba(15,23,42,0.25)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Wizyty
            </p>
          </div>
          <div className="grid grid-cols-2 gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setVisitsTrendMode("month")}
              className={`rounded-xl px-3 py-2 transition ${
                visitsTrendMode === "month"
                  ? "bg-slate-950 text-white"
                  : "text-slate-600"
              }`}
            >
              Miesiące
            </button>
            <button
              type="button"
              onClick={() => setVisitsTrendMode("week")}
              className={`rounded-xl px-3 py-2 transition ${
                visitsTrendMode === "week"
                  ? "bg-slate-950 text-white"
                  : "text-slate-600"
              }`}
            >
              Tygodnie
            </button>
          </div>
        </div>

        <TrendRows
          points={visitsTrend}
          formatter={(value) => String(value)}
          positiveColorClass="bg-sky-500"
        />
      </section>

      <ExpensesExperience recentExpenses={summary.recentExpenses} />
    </section>
  );
}
