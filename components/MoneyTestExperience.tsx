"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { createExpenseAction, deleteExpenseAction } from "../app/actions/expenses";
import type {
  CompletedAppointmentIncome,
  Expense,
  ExpenseAmountItem,
  FinanceProjectionSummary,
  FinanceSummary,
  PlannedAppointmentIncome,
} from "../lib/data/finances";
import { useBodyScrollLock } from "../lib/hooks/useBodyScrollLock";
import { useEscapeToClose } from "../lib/hooks/useEscapeToClose";
import { formatNumericDate, formatPrice } from "../lib/ui/format";
import { getTodayDateKey } from "../lib/utils/date";

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
  expenseValue: number;
  unrealizedValue: number;
};

const rangeOptions: Array<{ key: RangeKey; label: string }> = [
  { key: "today", label: "Dzisiaj" },
  { key: "week", label: "Tydzień" },
  { key: "month", label: "Miesiąc" },
  { key: "year", label: "Rok" },
];

const trendModes: Array<{ key: VisitsTrendMode; label: string }> = [
  { key: "month", label: "Miesiące" },
  { key: "week", label: "Tygodnie" },
];

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

function getEarliestDateKey(
  fallbackDateKey: string,
  dateGroups: Array<Array<{ date: string }>>,
) {
  return dateGroups.reduce((earliestDateKey, items) => {
    const groupEarliestDateKey = items.reduce((currentEarliest, item) => {
      if (!currentEarliest || item.date < currentEarliest) {
        return item.date;
      }

      return currentEarliest;
    }, "");

    if (!groupEarliestDateKey) {
      return earliestDateKey;
    }

    return groupEarliestDateKey < earliestDateKey ? groupEarliestDateKey : earliestDateKey;
  }, fallbackDateKey);
}

function getStartMonthForTrend(
  todayKey: string,
  latestMonthDate: Date,
  dateGroups: Array<Array<{ date: string }>>,
) {
  const earliestDate = parseDateKey(getEarliestDateKey(todayKey, dateGroups));
  const earliestMonthDate = new Date(
    earliestDate.getFullYear(),
    earliestDate.getMonth(),
    1,
    12,
  );
  const minimumVisibleStartDate = addMonths(latestMonthDate, -9);

  return earliestMonthDate < minimumVisibleStartDate
    ? earliestMonthDate
    : minimumVisibleStartDate;
}

function getStartWeekForTrend(
  todayKey: string,
  latestWeekStartDate: Date,
  dateGroups: Array<Array<{ date: string }>>,
) {
  const earliestDate = parseDateKey(getEarliestDateKey(todayKey, dateGroups));
  const earliestWeekStartDate = getStartOfWeek(earliestDate);
  const minimumVisibleStartDate = addDays(latestWeekStartDate, -63);

  return earliestWeekStartDate < minimumVisibleStartDate
    ? earliestWeekStartDate
    : minimumVisibleStartDate;
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

  return createPeriodSummary("Rok", String(yearDate.getFullYear()), incomes, expenses, from, to);
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
    const startWeekDate = getStartWeekForTrend(todayKey, latestWeekStartDate, [
      incomes,
      expenses,
      includeUnrealized ? plannedAppointments : [],
    ]);
    const pointCount =
      Math.round(
        (latestWeekStartDate.getTime() - startWeekDate.getTime()) /
          (1000 * 60 * 60 * 24 * 7),
      ) + 1;

    return Array.from({ length: pointCount }, (_, index) => {
      const startOfWeek = addDays(startWeekDate, index * 7);
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
        value: Math.max(0, income - expenseTotal),
        expenseValue: expenseTotal,
        unrealizedValue: Math.round(unrealizedAppointmentCount * averageIncomeLastMonth),
      };
    });
  }

  const latestMonthDate = getLatestMonthDate(
    todayKey,
    plannedAppointments,
    includeUnrealized,
  );
  const startMonthDate = getStartMonthForTrend(todayKey, latestMonthDate, [
    incomes,
    expenses,
    includeUnrealized ? plannedAppointments : [],
  ]);
  const pointCount =
    (latestMonthDate.getFullYear() - startMonthDate.getFullYear()) * 12 +
    latestMonthDate.getMonth() -
    startMonthDate.getMonth() +
    1;

  return Array.from({ length: pointCount }, (_, index) => {
    const monthDate = addMonths(startMonthDate, index);
    const from = toDateKey(monthDate);
    const to = toDateKey(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 12));
    const income = sumInRange(incomes, from, to);
    const expenseTotal = sumInRange(expenses, from, to);
    const unrealizedAppointmentCount = countInRange(plannedAppointments, from, to);

    return {
      key: `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`,
      label: getMonthShortLabel(monthDate),
      value: Math.max(0, income - expenseTotal),
      expenseValue: expenseTotal,
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
    const startMonthDate = getStartMonthForTrend(todayKey, latestMonthDate, [
      appointments,
      includeUnrealized ? plannedAppointments : [],
    ]);
    const pointCount =
      (latestMonthDate.getFullYear() - startMonthDate.getFullYear()) * 12 +
      latestMonthDate.getMonth() -
      startMonthDate.getMonth() +
      1;

    return Array.from({ length: pointCount }, (_, index) => {
      const monthDate = addMonths(startMonthDate, index);
      const from = toDateKey(monthDate);
      const to = toDateKey(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 12));
      const unrealizedAppointmentCount = countInRange(plannedAppointments, from, to);

      return {
        key: `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`,
        label: getMonthShortLabel(monthDate),
        value: countInRange(appointments, from, to),
        expenseValue: 0,
        unrealizedValue: unrealizedAppointmentCount,
      };
    });
  }

  const latestWeekStartDate = getLatestWeekStartDate(
    todayKey,
    plannedAppointments,
    includeUnrealized,
  );
  const startWeekDate = getStartWeekForTrend(todayKey, latestWeekStartDate, [
    appointments,
    includeUnrealized ? plannedAppointments : [],
  ]);
  const pointCount =
    Math.round(
      (latestWeekStartDate.getTime() - startWeekDate.getTime()) /
        (1000 * 60 * 60 * 24 * 7),
    ) + 1;

  return Array.from({ length: pointCount }, (_, index) => {
    const startOfWeek = addDays(startWeekDate, index * 7);
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
      expenseValue: 0,
      unrealizedValue: unrealizedAppointmentCount,
    };
  });
}

function getPercent(value: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

function DashboardCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </section>
  );
}

function IconBadge({ children, tone }: { children: ReactNode; tone: "blue" | "green" | "red" | "amber" }) {
  const toneClassName = {
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    red: "bg-rose-50 text-rose-700 ring-rose-100",
  }[tone];

  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ${toneClassName}`}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

function TrendBadge({
  label,
  tone,
}: {
  label: string;
  tone: "neutral" | "good" | "bad";
}) {
  const className = {
    bad: "bg-rose-50 text-rose-700 ring-rose-100",
    good: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    neutral: "bg-slate-50 text-slate-600 ring-slate-200",
  }[tone];

  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ${className}`}>
      {label}
    </span>
  );
}

function MetricCard({
  title,
  value,
  detail,
  icon,
  tone,
  badge,
}: {
  title: string;
  value: string;
  detail: string;
  icon: ReactNode;
  tone: "blue" | "green" | "red" | "amber";
  badge?: ReactNode;
}) {
  return (
    <DashboardCard className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <IconBadge tone={tone}>{icon}</IconBadge>
        {badge}
      </div>
      <div className="mt-5">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="mt-2 text-2xl font-bold tracking-normal text-slate-900">{value}</p>
        <p className="mt-1 text-xs font-medium text-slate-500">{detail}</p>
      </div>
    </DashboardCard>
  );
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ key: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="grid rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs font-semibold" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          onClick={() => onChange(option.key)}
          className={`rounded-md px-3 py-2 transition ${
            value === option.key
              ? "bg-white text-slate-950 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function PeriodToolbar({
  selectedRange,
  rangeOffset,
  selectedSummary,
  onRangeChange,
  onOffsetChange,
}: {
  selectedRange: RangeKey;
  rangeOffset: number;
  selectedSummary: FinancePeriodSummary;
  onRangeChange: (range: RangeKey) => void;
  onOffsetChange: (offset: number) => void;
}) {
  return (
    <DashboardCard className="p-3 sm:p-4">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
        <SegmentedControl
          options={rangeOptions}
          value={selectedRange}
          onChange={(range) => {
            onRangeChange(range);
            onOffsetChange(0);
          }}
        />

        <div className="grid grid-cols-[2.75rem_1fr_2.75rem] items-center gap-2">
          <button
            type="button"
            onClick={() => onOffsetChange(rangeOffset - 1)}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-xl text-slate-600 transition hover:bg-slate-50"
            aria-label="Pokaż wcześniejszy zakres"
          >
            ‹
          </button>
          <div className="min-w-0 text-center lg:min-w-52">
            <p className="truncate text-sm font-semibold text-slate-900">
              {selectedSummary.dateLabel}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">{getRangeOffsetLabel(rangeOffset)}</p>
          </div>
          <button
            type="button"
            onClick={() => onOffsetChange(rangeOffset + 1)}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-xl text-slate-600 transition hover:bg-slate-50"
            aria-label="Pokaż nowszy zakres"
          >
            ›
          </button>
        </div>
      </div>
    </DashboardCard>
  );
}

function SummaryPanel({ summary }: { summary: FinancePeriodSummary }) {
  const margin = getPercent(summary.profit, summary.income);

  return (
    <DashboardCard className="overflow-hidden">
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">{summary.title}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">{summary.dateLabel}</p>
          </div>
          <TrendBadge
            label={summary.profit >= 0 ? "Netto dodatnie" : "Netto ujemne"}
            tone={summary.profit >= 0 ? "good" : "bad"}
          />
        </div>
      </div>

      <div className="p-5">
        <p className="text-sm font-medium text-slate-500">Wynik netto</p>
        <p className={`mt-2 text-4xl font-bold tracking-normal ${summary.profit >= 0 ? "text-slate-950" : "text-rose-700"}`}>
          {formatPrice(summary.profit)}
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-400">
              Marża
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{margin}%</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-400">
              Netto / wizyta
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {formatPrice(summary.averageProfitPerAppointment)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-400">
              Średnia wizyta
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {formatPrice(summary.averageAppointmentIncome)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-400">
              Tipy
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {formatPrice(summary.tipTotal)}
            </p>
          </div>
        </div>
      </div>
    </DashboardCard>
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

  return (
    <div className="border-b border-slate-100 px-5 py-4 last:border-b-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">{item.label}</p>
          <p className="mt-1 text-xs font-medium text-slate-500">
            {formatRangeLabel(item.from, item.to)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-bold text-slate-950">{formatPrice(item.totalIncome)}</p>
          <p className="mt-1 text-xs text-slate-500">
            {item.unrealizedAppointmentCount} w planie
          </p>
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="flex h-full">
          {item.earnedIncome > 0 ? (
            <div className="h-full bg-slate-950" style={{ width: `${earnedWidth}%` }} />
          ) : null}
          {item.unrealizedIncome > 0 ? (
            <div className="h-full bg-blue-300" style={{ width: `${unrealizedWidth}%` }} />
          ) : null}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-slate-500">Zarobione</p>
          <p className="mt-1 font-semibold text-slate-900">{formatPrice(item.earnedIncome)}</p>
        </div>
        <div>
          <p className="text-slate-500">Prognoza</p>
          <p className="mt-1 font-semibold text-slate-900">{formatPrice(item.estimatedIncome)}</p>
        </div>
      </div>
    </div>
  );
}

function ProjectionPanel({ projected }: { projected: FinanceSummary["projected"] }) {
  const items = [projected.currentWeek, projected.nextWeek, projected.currentMonth];
  const maxTotal = Math.max(
    1,
    ...items.map((item) => Math.max(item.totalIncome, item.earnedIncome, item.estimatedIncome)),
  );
  const progress = getPercent(
    projected.currentMonth.earnedIncome,
    Math.max(1, projected.currentMonth.estimatedIncome),
  );
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <DashboardCard className="overflow-hidden">
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Prognoza</p>
            <p className="mt-1 text-xs font-medium text-slate-500">Przychody na podstawie planu</p>
          </div>
          <TrendBadge label={`${clampedProgress}% miesiąca`} tone="neutral" />
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[16rem_1fr]">
        <div className="flex flex-col items-center justify-center border-b border-slate-100 p-6 lg:border-b-0 lg:border-r">
          <div
            className="grid h-36 w-36 place-items-center rounded-full"
            style={{
              background: `conic-gradient(#2563eb ${clampedProgress * 3.6}deg, #e2e8f0 0deg)`,
            }}
          >
            <div className="grid h-28 w-28 place-items-center rounded-full bg-white">
              <div className="text-center">
                <p className="text-3xl font-bold text-slate-950">{clampedProgress}%</p>
                <p className="text-xs font-medium text-slate-500">realizacji</p>
              </div>
            </div>
          </div>
          <p className="mt-4 text-center text-sm font-medium text-slate-600">
            Ten miesiąc: {formatPrice(projected.currentMonth.totalIncome)}
          </p>
        </div>

        <div>
          {items.map((item) => (
            <ProjectionRow
              key={item.label}
              item={item}
              maxTotal={maxTotal}
            />
          ))}
        </div>
      </div>
    </DashboardCard>
  );
}

function ShowUnrealizedToggle({
  showUnrealized,
  onClick,
}: {
  showUnrealized: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ring-1 transition ${
        showUnrealized
          ? "bg-slate-950 text-white ring-slate-950"
          : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${showUnrealized ? "bg-blue-300" : "bg-slate-300"}`}
        aria-hidden="true"
      />
      {showUnrealized ? "Z planem" : "Bez planu"}
    </button>
  );
}

function getTrendPages(points: TrendPoint[]) {
  const pages: TrendPoint[][] = [];

  for (let endIndex = points.length; endIndex > 0; endIndex -= 10) {
    pages.push(points.slice(Math.max(0, endIndex - 10), endIndex));
  }

  return pages.length > 0 ? pages : [[]];
}

function HorizontalTrendChart({
  points,
  formatter,
  showUnrealized,
  showExpenses,
}: {
  points: TrendPoint[];
  formatter: (value: number) => string;
  showUnrealized: boolean;
  showExpenses: boolean;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pages = getTrendPages(points);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ left: 0 });
  }, [points]);

  return (
    <div
      ref={scrollerRef}
      className="-mx-2 overflow-x-auto overscroll-x-contain px-2 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <div className="flex snap-x snap-mandatory gap-3">
        {pages.map((page, pageIndex) => {
          const positiveMaxValue = Math.max(
            1,
            ...page.map((point) =>
              point.value + (showUnrealized ? point.unrealizedValue : 0),
            ),
          );
          const expenseMaxValue = Math.max(
            1,
            ...page.map((point) => (showExpenses ? point.expenseValue : 0)),
          );
          return (
            <div
              key={`${pageIndex}-${page[0]?.key ?? "empty"}`}
              className="min-w-full snap-start rounded-lg border border-slate-100 bg-slate-50 p-3"
            >
              <div className="space-y-3">
                {page.map((point) => {
                  const visibleUnrealizedValue =
                    showUnrealized && point.unrealizedValue > 0
                      ? point.unrealizedValue
                      : 0;
                  const positiveTotal = point.value + visibleUnrealizedValue;
                  const positiveBarWidth =
                    positiveTotal > 0 ? (positiveTotal / positiveMaxValue) * 100 : 0;
                  const valueWidth =
                    positiveTotal > 0 && point.value > 0
                      ? (point.value / positiveTotal) * 100
                      : 0;
                  const unrealizedWidth =
                    positiveTotal > 0 && visibleUnrealizedValue > 0
                      ? (visibleUnrealizedValue / positiveTotal) * 100
                      : 0;
                  const expenseWidth =
                    showExpenses && point.expenseValue > 0
                      ? (point.expenseValue / expenseMaxValue) * 100
                      : 0;

                  return (
                    <div
                      key={point.key}
                      className={`grid items-center ${
                        showExpenses
                          ? "grid-cols-[3.5rem_4.25rem_minmax(0,0.72fr)_1px_minmax(0,1.18fr)_4.75rem]"
                          : "grid-cols-[3.5rem_1px_minmax(0,1fr)_4.75rem]"
                      }`}
                    >
                      <p className="pr-2 text-xs font-bold leading-tight text-slate-500">
                        {point.label}
                      </p>

                      {showExpenses ? (
                        <>
                          <p className="pr-4 text-left text-[10px] font-bold leading-none text-rose-700">
                            {point.expenseValue > 0 ? formatter(point.expenseValue) : ""}
                          </p>
                          <div className="flex h-7 items-center justify-end">
                            {point.expenseValue > 0 ? (
                              <div
                                className="h-4 min-w-1 rounded-l-md bg-rose-500"
                                style={{ width: `${expenseWidth}%` }}
                                title={formatter(point.expenseValue)}
                              />
                            ) : null}
                          </div>
                        </>
                      ) : null}

                      <div className="relative z-10 h-8 w-px rounded-full bg-slate-400" />

                      <div className="flex h-7 items-center">
                        {positiveTotal > 0 ? (
                          <div
                            className="flex h-4 min-w-1 overflow-hidden rounded-r-md"
                            style={{ width: `${positiveBarWidth}%` }}
                          >
                            {point.value > 0 ? (
                              <div
                                className="bg-emerald-500"
                                style={{ width: `${valueWidth}%` }}
                                title={formatter(point.value)}
                              />
                            ) : null}
                            {visibleUnrealizedValue > 0 ? (
                              <div
                                className="bg-emerald-200"
                                style={{ width: `${unrealizedWidth}%` }}
                                title={formatter(visibleUnrealizedValue)}
                              />
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                      <p className="pl-4 text-right text-[10px] font-bold leading-none text-emerald-700">
                        {positiveTotal > 0 ? formatter(positiveTotal) : ""}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TrendPanel({
  title,
  points,
  formatter,
  showUnrealized,
  onToggleUnrealized,
  children,
  valueLabel = "Netto",
  showExpenses = false,
}: {
  title: string;
  points: TrendPoint[];
  formatter: (value: number) => string;
  showUnrealized: boolean;
  onToggleUnrealized: () => void;
  children?: ReactNode;
  valueLabel?: string;
  showExpenses?: boolean;
}) {
  return (
    <DashboardCard className="p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
        </div>
        <ShowUnrealizedToggle showUnrealized={showUnrealized} onClick={onToggleUnrealized} />
      </div>
      {children ? <div className="mb-4">{children}</div> : null}
      <HorizontalTrendChart
        points={points}
        formatter={formatter}
        showUnrealized={showUnrealized}
        showExpenses={showExpenses}
      />
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded-md bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700 ring-1 ring-emerald-100">
          {valueLabel}
        </span>
        {showUnrealized ? (
          <span className="rounded-md bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700 ring-1 ring-emerald-100">
            Plan
          </span>
        ) : null}
        {showExpenses ? (
          <span className="rounded-md bg-rose-50 px-2.5 py-1 font-semibold text-rose-700 ring-1 ring-rose-100">
            Wydatki
          </span>
        ) : null}
      </div>
    </DashboardCard>
  );
}

function ExpensesPanel({ recentExpenses }: { recentExpenses: Expense[] }) {
  const router = useRouter();
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState("");

  function openExpenseModal() {
    setActionError("");
    setIsExpenseModalOpen(true);
  }

  function closeExpenseModal() {
    if (isPending) {
      return;
    }

    setActionError("");
    setIsExpenseModalOpen(false);
  }

  useBodyScrollLock(isExpenseModalOpen);
  useEscapeToClose({
    enabled: isExpenseModalOpen,
    isBlocked: isPending,
    onClose: closeExpenseModal,
  });

  async function submitExpense(formData: FormData) {
    startTransition(async () => {
      const result = await createExpenseAction(formData);

      if (!result.ok) {
        setActionError(
          result.error ??
            "Nie udało się zapisać wydatku. Sprawdź, czy SQL 006 jest odpalony.",
        );
        return;
      }

      setIsExpenseModalOpen(false);
      setActionError("");
      router.refresh();
    });
  }

  async function submitDeleteExpense(formData: FormData) {
    startTransition(async () => {
      const result = await deleteExpenseAction(formData);

      if (!result.ok) {
        setActionError(
          result.error ??
            "Nie udało się usunąć wydatku. Sprawdź, czy SQL 006 jest odpalony.",
        );
        return;
      }

      router.refresh();
    });
  }

  return (
    <>
      <DashboardCard className="overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Ostatnie wydatki</p>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Koszty zapisane w bazie finansów
            </p>
          </div>
          <button
            type="button"
            onClick={openExpenseModal}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            Dodaj
          </button>
        </div>

        {actionError && !isExpenseModalOpen ? (
          <div className="mx-5 mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {actionError}
          </div>
        ) : null}

        {recentExpenses.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {recentExpenses.map((expense) => (
              <div key={expense.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{expense.name}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    {expense.source} · {formatNumericDate(expense.date)}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <p className="text-sm font-bold text-rose-700">{formatPrice(expense.amount)}</p>
                  <form action={submitDeleteExpense}>
                    <input type="hidden" name="expenseId" value={expense.id} />
                    <button
                      type="submit"
                      disabled={isPending}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
                      aria-label={`Usuń wydatek: ${expense.name}`}
                    >
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      >
                        <path d="M3 6h18" />
                        <path d="M8 6V4h8v2" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v5" />
                        <path d="M14 11v5" />
                      </svg>
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-8 text-sm font-medium text-slate-500">
            Nie ma jeszcze zapisanych wydatków.
          </div>
        )}
      </DashboardCard>

      {isExpenseModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-4 backdrop-blur-[2px] sm:items-center">
          <div className="absolute inset-0" onClick={closeExpenseModal} aria-hidden="true" />
          <section className="relative z-10 max-h-[85vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-xl shadow-slate-300">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Nowy wydatek
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">Dodaj koszt</h2>
              </div>
              <button
                type="button"
                onClick={closeExpenseModal}
                disabled={isPending}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                aria-label="Zamknij dodawanie wydatku"
              >
                ×
              </button>
            </div>

            <form action={submitExpense} className="mt-6 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Nazwa</span>
                <input
                  name="name"
                  type="text"
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </label>

              <div className="grid grid-cols-1 gap-3 min-[440px]:grid-cols-2">
                <label className="block min-w-0 space-y-2">
                  <span className="text-sm font-medium text-slate-700">Kwota</span>
                  <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50">
                    <input
                      name="amount"
                      type="number"
                      min="1"
                      step="1"
                      required
                      className="w-full min-w-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    />
                    <span className="shrink-0 text-sm font-semibold text-slate-500">PLN</span>
                  </div>
                </label>

                <label className="block min-w-0 space-y-2">
                  <span className="text-sm font-medium text-slate-700">Data</span>
                  <input
                    name="date"
                    type="date"
                    required
                    defaultValue={getTodayDateKey()}
                    className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  />
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Źródło</span>
                <input
                  name="source"
                  type="text"
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </label>

              {actionError ? (
                <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {actionError}
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeExpenseModal}
                  disabled={isPending}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Wróć
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400"
                >
                  {isPending ? "Zapisywanie..." : "Zapisz"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}

function MoneyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7h16v10H4z" />
      <path d="M8 12h.01" />
      <path d="M16 12h.01" />
      <path d="M12 10a2 2 0 1 1 0 4a2 2 0 0 1 0-4" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7a2 2 0 0 1 2-2h12" />
      <path d="M4 7v10a2 2 0 0 0 2 2h14V9H6a2 2 0 0 1-2-2" />
      <path d="M17 14h.01" />
    </svg>
  );
}

function ReceiptIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 3h12v18l-3-2l-3 2l-3-2l-3 2z" />
      <path d="M9 8h6" />
      <path d="M9 12h6" />
      <path d="M9 16h4" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <path d="M3 10h18" />
      <rect x="3" y="5" width="18" height="16" rx="2" />
    </svg>
  );
}

export default function MoneyTestExperience({ summary }: Props) {
  const [selectedRange, setSelectedRange] = useState<RangeKey>("month");
  const [rangeOffset, setRangeOffset] = useState(0);
  const [netTrendMode, setNetTrendMode] = useState<VisitsTrendMode>("month");
  const [visitsTrendMode, setVisitsTrendMode] = useState<VisitsTrendMode>("month");
  const [showUnrealizedNet, setShowUnrealizedNet] = useState(true);
  const [showUnrealizedVisits, setShowUnrealizedVisits] = useState(true);

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
  const expenseRatio = getPercent(selectedSummary.expenses, selectedSummary.income);
  const monthProjection = summary.projected.currentMonth;

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.08em] text-blue-700 ring-1 ring-blue-100">
                TEST
              </span>
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">
              Pieniądze TEST
            </h1>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm sm:min-w-72">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium text-slate-500">Śr. wizyta</p>
              <p className="mt-1 font-bold text-slate-900">
                {formatPrice(summary.projected.averageIncomeLastMonth)}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium text-slate-500">Plan miesiąca</p>
              <p className="mt-1 font-bold text-slate-900">
                {formatPrice(monthProjection.estimatedIncome)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <PeriodToolbar
        selectedRange={selectedRange}
        rangeOffset={rangeOffset}
        selectedSummary={selectedSummary}
        onRangeChange={setSelectedRange}
        onOffsetChange={setRangeOffset}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Netto"
          value={formatPrice(selectedSummary.profit)}
          detail={`${selectedSummary.title}: ${selectedSummary.dateLabel}`}
          icon={<MoneyIcon />}
          tone={selectedSummary.profit >= 0 ? "green" : "red"}
          badge={
            <TrendBadge
              label={selectedSummary.profit >= 0 ? "Plus" : "Minus"}
              tone={selectedSummary.profit >= 0 ? "good" : "bad"}
            />
          }
        />
        <MetricCard
          title="Przychód"
          value={formatPrice(selectedSummary.income)}
          detail={`${selectedSummary.appointmentCount} zakończonych wizyt`}
          icon={<WalletIcon />}
          tone="blue"
        />
        <MetricCard
          title="Wydatki"
          value={formatPrice(selectedSummary.expenses)}
          detail={`${expenseRatio}% przychodu w tym zakresie`}
          icon={<ReceiptIcon />}
          tone="red"
        />
        <MetricCard
          title="Wizyty"
          value={String(selectedSummary.appointmentCount)}
          detail={`Średnio ${formatPrice(selectedSummary.averageAppointmentIncome)}`}
          icon={<CalendarIcon />}
          tone="amber"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.45fr]">
        <SummaryPanel summary={selectedSummary} />
        <ProjectionPanel projected={summary.projected} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <TrendPanel
          title="Zysk netto"
          points={netTrend}
          formatter={(value) => formatPrice(value)}
          showUnrealized={showUnrealizedNet}
          onToggleUnrealized={() =>
            setShowUnrealizedNet((currentValue) => !currentValue)
          }
          showExpenses
        >
          <SegmentedControl
            options={trendModes}
            value={netTrendMode}
            onChange={setNetTrendMode}
          />
        </TrendPanel>

        <TrendPanel
          title="Wizyty"
          points={visitsTrend}
          formatter={(value) => String(value)}
          showUnrealized={showUnrealizedVisits}
          onToggleUnrealized={() =>
            setShowUnrealizedVisits((currentValue) => !currentValue)
          }
          valueLabel="Wizyty"
        >
          <SegmentedControl
            options={trendModes}
            value={visitsTrendMode}
            onChange={setVisitsTrendMode}
          />
        </TrendPanel>
      </section>

      <ExpensesPanel recentExpenses={summary.recentExpenses} />
    </div>
  );
}
