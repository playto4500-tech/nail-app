"use client";

import { useState, type ReactNode } from "react";
import ExpensesExperience from "./ExpensesExperience";
import type {
  CompletedAppointmentIncome,
  ExpenseAmountItem,
  FinanceProjectionSummary,
  FinanceSummary,
  PlannedAppointmentIncome,
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
  unrealizedValue: number;
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

function countInRange<T extends { date: string }>(items: T[], from: string, to: string) {
  return items.filter((item) => item.date >= from && item.date <= to).length;
}

function getLatestMonthDate(
  todayKey: string,
  plannedAppointments: PlannedAppointmentIncome[],
  includeUnrealized: boolean,
) {
  const today = parseDateKey(todayKey);

  if (!includeUnrealized || plannedAppointments.length === 0) {
    return new Date(today.getFullYear(), today.getMonth(), 1, 12);
  }

  return plannedAppointments.reduce(
    (latestDate, appointment) => {
      const appointmentDate = parseDateKey(appointment.date);

      if (appointmentDate > latestDate) {
        return new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), 1, 12);
      }

      return latestDate;
    },
    new Date(today.getFullYear(), today.getMonth(), 1, 12),
  );
}

function getLatestWeekStartDate(
  todayKey: string,
  plannedAppointments: PlannedAppointmentIncome[],
  includeUnrealized: boolean,
) {
  const currentWeekStart = getStartOfWeek(parseDateKey(todayKey));

  if (!includeUnrealized || plannedAppointments.length === 0) {
    return currentWeekStart;
  }

  return plannedAppointments.reduce((latestWeekStart, appointment) => {
    const appointmentWeekStart = getStartOfWeek(parseDateKey(appointment.date));

    return appointmentWeekStart > latestWeekStart ? appointmentWeekStart : latestWeekStart;
  }, currentWeekStart);
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

function buildNetTrend(
  todayKey: string,
  mode: VisitsTrendMode,
  incomes: CompletedAppointmentIncome[],
  expenses: ExpenseAmountItem[],
  plannedAppointments: PlannedAppointmentIncome[],
  averageIncomeLastMonth: number,
  includeUnrealized: boolean,
) {
  if (mode === "week") {
    const latestWeekStartDate = getLatestWeekStartDate(
      todayKey,
      plannedAppointments,
      includeUnrealized,
    );

    return Array.from({ length: 10 }, (_, index) => {
      const startOfWeek = addDays(latestWeekStartDate, (index - 9) * 7);
      const endOfWeek = addDays(startOfWeek, 6);
      const from = toDateKey(startOfWeek);
      const to = toDateKey(endOfWeek);
      const income = sumInRange(incomes, from, to);
      const expenseTotal = sumInRange(expenses, from, to);
      const unrealizedAppointmentCount = countInRange(plannedAppointments, from, to);

      return {
        key: from,
        label: new Intl.DateTimeFormat("pl-PL", {
          day: "2-digit",
          month: "2-digit",
        }).format(startOfWeek),
        value: income - expenseTotal,
        unrealizedValue: Math.round(unrealizedAppointmentCount * averageIncomeLastMonth),
      };
    });
  }

  const latestMonthDate = getLatestMonthDate(
    todayKey,
    plannedAppointments,
    includeUnrealized,
  );

  return Array.from({ length: 10 }, (_, index) => {
    const monthDate = addMonths(latestMonthDate, index - 9);
    const from = toDateKey(monthDate);
    const to = toDateKey(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 12));
    const income = sumInRange(incomes, from, to);
    const expenseTotal = sumInRange(expenses, from, to);
    const unrealizedAppointmentCount = countInRange(plannedAppointments, from, to);

    return {
      key: `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`,
      label: getMonthShortLabel(monthDate),
      value: income - expenseTotal,
      unrealizedValue: Math.round(unrealizedAppointmentCount * averageIncomeLastMonth),
    };
  });
}

function buildVisitsTrend(
  todayKey: string,
  mode: VisitsTrendMode,
  appointments: CompletedAppointmentIncome[],
  plannedAppointments: PlannedAppointmentIncome[],
  includeUnrealized: boolean,
) {
  if (mode === "month") {
    const latestMonthDate = getLatestMonthDate(
      todayKey,
      plannedAppointments,
      includeUnrealized,
    );

    return Array.from({ length: 10 }, (_, index) => {
      const monthDate = addMonths(latestMonthDate, index - 9);
      const from = toDateKey(monthDate);
      const to = toDateKey(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 12));
      const unrealizedAppointmentCount = countInRange(plannedAppointments, from, to);

      return {
        key: `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`,
        label: getMonthShortLabel(monthDate),
        value: countInRange(appointments, from, to),
        unrealizedValue: unrealizedAppointmentCount,
      };
    });
  }

  const latestWeekStartDate = getLatestWeekStartDate(
    todayKey,
    plannedAppointments,
    includeUnrealized,
  );

  return Array.from({ length: 10 }, (_, index) => {
    const startOfWeek = addDays(latestWeekStartDate, (index - 9) * 7);
    const endOfWeek = addDays(startOfWeek, 6);
    const from = toDateKey(startOfWeek);
    const to = toDateKey(endOfWeek);
    const unrealizedAppointmentCount = countInRange(plannedAppointments, from, to);

    return {
      key: from,
      label: new Intl.DateTimeFormat("pl-PL", {
        day: "2-digit",
        month: "2-digit",
      }).format(startOfWeek),
      value: countInRange(appointments, from, to),
      unrealizedValue: unrealizedAppointmentCount,
    };
  });
}

function SelectedRangeSummary({ summary }: { summary: FinancePeriodSummary }) {
  return (
    <section className="rounded-[24px] bg-white p-5 shadow-sm shadow-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{summary.title}</p>
          <p className="mt-1 text-sm text-slate-500">{summary.dateLabel}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">
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
}: {
  item: FinanceProjectionSummary;
  maxTotal: number;
}) {
  const earnedWidth = item.earnedIncome > 0 ? (item.earnedIncome / maxTotal) * 100 : 0;
  const unrealizedWidth =
    item.unrealizedIncome > 0 ? (item.unrealizedIncome / maxTotal) * 100 : 0;
  const markerLeft =
    item.estimatedIncome > 0 ? Math.min(100, (item.estimatedIncome / maxTotal) * 100) : 0;
  const showEarnedMetric = item.mode === "mixed";
  const showEstimateMarker =
    item.mode === "mixed" && item.estimatedIncome > 0 && item.earnedIncome > item.estimatedIncome;

  return (
    <article className="rounded-[20px] border border-slate-100 bg-slate-50 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{item.label}</p>
          <p className="mt-1 text-xs text-slate-500">{formatRangeLabel(item.from, item.to)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-950">{formatPrice(item.totalIncome)}</p>
          <p className="mt-1 text-xs text-slate-500">
            Plan: {formatPrice(item.estimatedIncome)}
          </p>
        </div>
      </div>

      <div className="relative mt-4 h-3 overflow-hidden rounded-full bg-white">
        <div className="flex h-full">
          {item.earnedIncome > 0 ? (
            <div
              className="h-full rounded-l-full bg-slate-950"
              style={{ width: `${earnedWidth}%` }}
            />
          ) : null}
          {item.unrealizedIncome > 0 ? (
            <div
              className={`h-full ${
                item.earnedIncome > 0 ? "rounded-r-full" : "rounded-full"
              } bg-slate-300`}
              style={{ width: `${unrealizedWidth}%` }}
            />
          ) : null}
        </div>
        {showEstimateMarker ? (
          <div
            className="absolute top-0 h-full border-l-2 border-dashed border-amber-500"
            style={{ left: `${markerLeft}%` }}
          />
        ) : null}
      </div>

      <div className={`mt-3 grid gap-3 text-xs ${showEarnedMetric ? "grid-cols-2" : "grid-cols-1"}`}>
        {showEarnedMetric ? (
          <div>
            <p className="text-slate-500">Zarobione</p>
            <p className="mt-1 font-semibold text-slate-900">{formatPrice(item.earnedIncome)}</p>
          </div>
        ) : null}
        <div>
          <p className="text-slate-500">Niezrealizowane</p>
          <p className="mt-1 font-semibold text-slate-900">
            {formatPrice(item.unrealizedIncome)}
          </p>
        </div>
      </div>

      <div className="mt-3 text-xs text-slate-500">
        <span>{item.unrealizedAppointmentCount} niezrealizowanych wizyt</span>
      </div>
    </article>
  );
}

function ProjectedEarningsCard({ projected }: { projected: FinanceSummary["projected"] }) {
  const items = [projected.currentWeek, projected.nextWeek, projected.currentMonth];
  const maxTotal = Math.max(
    1,
    ...items.map((item) => Math.max(item.totalIncome, item.earnedIncome, item.estimatedIncome)),
  );

  return (
    <section className="space-y-4 rounded-[24px] bg-white p-5 shadow-sm shadow-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Prognoza</p>
          <p className="mt-1 text-xs text-slate-500">Plan przychodów</p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-3 py-2 text-right">
          <p className="text-xs text-slate-500">Średnia wizyta</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {formatPrice(projected.averageIncomeLastMonth)}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <ProjectionRow
            key={item.label}
            item={item}
            maxTotal={maxTotal}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-slate-950 px-3 py-1 text-white">Zarobione</span>
        <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-700">
          Niezrealizowane
        </span>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">
          Przerywana linia = plan
        </span>
      </div>
    </section>
  );
}

function TrendRows({
  points,
  formatter,
  showUnrealized,
  primaryColorClass,
  secondaryColorClass,
  negativeColorClass,
}: {
  points: TrendPoint[];
  formatter: (value: number) => string;
  showUnrealized: boolean;
  primaryColorClass: string;
  secondaryColorClass: string;
  negativeColorClass?: string;
}) {
  const maxValue = Math.max(
    1,
    ...points.map((point) =>
      Math.abs(point.value) + (showUnrealized ? Math.abs(point.unrealizedValue) : 0),
    ),
  );

  return (
    <div className="space-y-3">
      {points.map((point) => {
        const totalValue = point.value + (showUnrealized ? point.unrealizedValue : 0);
        const primaryWidth =
          point.value === 0 ? 0 : Math.max(6, (Math.abs(point.value) / maxValue) * 100);
        const secondaryWidth =
          showUnrealized && point.unrealizedValue > 0
            ? Math.max(6, (Math.abs(point.unrealizedValue) / maxValue) * 100)
            : 0;
        const primaryClassName =
          point.value >= 0 ? primaryColorClass : negativeColorClass ?? primaryColorClass;

        return (
          <div key={point.key} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-slate-700">{point.label}</p>
              <p
                className={`text-xs font-semibold ${
                  totalValue >= 0 ? "text-slate-900" : "text-rose-700"
                }`}
              >
                {formatter(totalValue)}
              </p>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div className="flex h-full">
                {point.value !== 0 ? (
                  <div
                    className={`h-full ${showUnrealized ? "rounded-l-full" : "rounded-full"} ${primaryClassName}`}
                    style={{ width: `${primaryWidth}%` }}
                  />
                ) : null}
                {showUnrealized && point.unrealizedValue > 0 ? (
                  <div
                    className={`h-full ${
                      point.value !== 0 ? "rounded-r-full" : "rounded-full"
                    } ${secondaryColorClass}`}
                    style={{ width: `${secondaryWidth}%` }}
                  />
                ) : null}
              </div>
            </div>
            {showUnrealized && point.unrealizedValue > 0 ? (
              <p className="text-xs text-slate-500">
                Niezrealizowane: {formatter(point.unrealizedValue)}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function ShowUnrealizedButton({
  showUnrealized,
  onClick,
  className = "",
}: {
  showUnrealized: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl px-3 py-2 text-xs font-semibold transition ${className} ${
        showUnrealized
          ? "bg-slate-950 text-white"
          : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
      }`}
    >
      {showUnrealized ? "Ukryj niezrealizowane" : "Pokaż niezrealizowane"}
    </button>
  );
}

function TrendBars({
  title,
  points,
  formatter,
  showUnrealized,
  onToggleUnrealized,
  primaryColorClass,
  secondaryColorClass,
  negativeColorClass,
  children,
}: {
  title: string;
  points: TrendPoint[];
  formatter: (value: number) => string;
  showUnrealized: boolean;
  onToggleUnrealized: () => void;
  primaryColorClass: string;
  secondaryColorClass: string;
  negativeColorClass?: string;
  children?: ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-[24px] bg-white p-5 shadow-sm shadow-slate-200">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <ShowUnrealizedButton
          showUnrealized={showUnrealized}
          onClick={onToggleUnrealized}
          className="shrink-0"
        />
      </div>
      {children ? <div>{children}</div> : null}
      <TrendRows
        points={points}
        formatter={formatter}
        showUnrealized={showUnrealized}
        primaryColorClass={primaryColorClass}
        secondaryColorClass={secondaryColorClass}
        negativeColorClass={negativeColorClass}
      />
    </section>
  );
}

export default function MoneyExperience({ summary }: Props) {
  const [selectedRange, setSelectedRange] = useState<RangeKey>("month");
  const [rangeOffset, setRangeOffset] = useState(0);
  const [netTrendMode, setNetTrendMode] = useState<VisitsTrendMode>("month");
  const [visitsTrendMode, setVisitsTrendMode] = useState<VisitsTrendMode>("month");
  const [showUnrealizedNet, setShowUnrealizedNet] = useState(false);
  const [showUnrealizedVisits, setShowUnrealizedVisits] = useState(false);

  const selectedSummary = getSelectedRangeSummary(
    summary.todayKey,
    selectedRange,
    rangeOffset,
    summary.completedAppointments,
    summary.expenseItems,
  );
  const netTrend = buildNetTrend(
    summary.todayKey,
    netTrendMode,
    summary.completedAppointments,
    summary.expenseItems,
    summary.plannedAppointments,
    summary.projected.averageIncomeLastMonth,
    showUnrealizedNet,
  );
  const visitsTrend = buildVisitsTrend(
    summary.todayKey,
    visitsTrendMode,
    summary.completedAppointments,
    summary.plannedAppointments,
    showUnrealizedVisits,
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
        title="Zysk netto"
        points={netTrend}
        formatter={(value) => formatPrice(value)}
        showUnrealized={showUnrealizedNet}
        onToggleUnrealized={() =>
          setShowUnrealizedNet((currentValue) => !currentValue)
        }
        primaryColorClass="bg-slate-950"
        secondaryColorClass="bg-slate-300"
        negativeColorClass="bg-rose-400"
      >
        <div className="grid grid-cols-2 gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setNetTrendMode("month")}
            className={`rounded-xl px-3 py-2 transition ${
              netTrendMode === "month" ? "bg-slate-950 text-white" : "text-slate-600"
            }`}
          >
            Miesiące
          </button>
          <button
            type="button"
            onClick={() => setNetTrendMode("week")}
            className={`rounded-xl px-3 py-2 transition ${
              netTrendMode === "week" ? "bg-slate-950 text-white" : "text-slate-600"
            }`}
          >
            Tygodnie
          </button>
        </div>
      </TrendBars>

      <section className="space-y-4 rounded-[24px] bg-white p-5 shadow-sm shadow-slate-200">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold text-slate-900">Wizyty</p>
          <ShowUnrealizedButton
            showUnrealized={showUnrealizedVisits}
            onClick={() => setShowUnrealizedVisits((currentValue) => !currentValue)}
            className="shrink-0"
          />
        </div>

        <div className="grid grid-cols-2 gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setVisitsTrendMode("month")}
            className={`rounded-xl px-3 py-2 transition ${
              visitsTrendMode === "month" ? "bg-slate-950 text-white" : "text-slate-600"
            }`}
          >
            Miesiące
          </button>
          <button
            type="button"
            onClick={() => setVisitsTrendMode("week")}
            className={`rounded-xl px-3 py-2 transition ${
              visitsTrendMode === "week" ? "bg-slate-950 text-white" : "text-slate-600"
            }`}
          >
            Tygodnie
          </button>
        </div>

        <TrendRows
          points={visitsTrend}
          formatter={(value) => String(value)}
          showUnrealized={showUnrealizedVisits}
          primaryColorClass="bg-slate-950"
          secondaryColorClass="bg-slate-300"
        />
      </section>

      <ExpensesExperience recentExpenses={summary.recentExpenses} />
    </section>
  );
}
