import type { Appointment } from "../data/appointments";

export type PlannerView = "month" | "week";

export type CalendarDay = {
  date: Date;
  dateKey: string;
  dayNumber: number;
  inCurrentMonth: boolean;
  isToday: boolean;
};

const WEEKDAY_LABELS = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"];
const WORKDAY_START_MINUTES = 9 * 60;
const WORKDAY_END_MINUTES = 20 * 60;
const SLOT_INTERVAL_MINUTES = 30;

export function getWeekdayLabels() {
  return WEEKDAY_LABELS;
}

export function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

export function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1, 12, 0, 0);
}

export function startOfWeek(date: Date) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  return new Date(start.getFullYear(), start.getMonth(), start.getDate(), 12, 0, 0);
}

function buildCalendarDay(date: Date, currentMonth: number, todayKey: string): CalendarDay {
  return {
    date,
    dateKey: toDateKey(date),
    dayNumber: date.getDate(),
    inCurrentMonth: date.getMonth() === currentMonth,
    isToday: toDateKey(date) === todayKey,
  };
}

export function buildMonthGrid(anchorDate: Date, todayKey: string) {
  const currentMonth = anchorDate.getMonth();
  const firstDayOfMonth = new Date(
    anchorDate.getFullYear(),
    anchorDate.getMonth(),
    1,
    12,
    0,
    0,
  );
  const gridStart = startOfWeek(firstDayOfMonth);

  return Array.from({ length: 6 }, (_, weekIndex) =>
    Array.from({ length: 7 }, (_, dayIndex) => {
      const date = addDays(gridStart, weekIndex * 7 + dayIndex);
      return buildCalendarDay(date, currentMonth, todayKey);
    }),
  );
}

export function buildWeekDays(anchorDate: Date, todayKey: string) {
  const weekStart = startOfWeek(anchorDate);
  const currentMonth = anchorDate.getMonth();

  return Array.from({ length: 7 }, (_, index) =>
    buildCalendarDay(addDays(weekStart, index), currentMonth, todayKey),
  );
}

export function formatMonthLabel(date: Date) {
  const formatted = new Intl.DateTimeFormat("pl-PL", {
    month: "long",
    year: "numeric",
  }).format(date);

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatWeekRangeLabel(anchorDate: Date) {
  const weekStart = startOfWeek(anchorDate);
  const weekEnd = addDays(weekStart, 6);

  const startLabel = new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "long",
  }).format(weekStart);
  const endLabel = new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(weekEnd);

  return `${startLabel} - ${endLabel}`;
}

function minutesToTimeLabel(totalMinutes: number) {
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function getSuggestedTimeSlots(
  dateKey: string,
  appointments: Appointment[],
) {
  const todayKey = toDateKey(new Date());

  if (dateKey < todayKey) {
    return [];
  }

  const occupiedTimes = new Set(
    appointments
      .filter((appointment) => appointment.status !== "cancelled")
      .map((appointment) => appointment.time.slice(0, 5)),
  );

  const availableSlots: string[] = [];

  for (
    let currentMinutes = WORKDAY_START_MINUTES;
    currentMinutes <= WORKDAY_END_MINUTES;
    currentMinutes += SLOT_INTERVAL_MINUTES
  ) {
    const label = minutesToTimeLabel(currentMinutes);

    if (!occupiedTimes.has(label)) {
      availableSlots.push(label);
    }
  }
  return availableSlots;
}
