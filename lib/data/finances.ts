import { createClient } from "../../utils/supabase/server";
import { getTodayDateKey } from "../utils/date";

export type Expense = {
  id: number;
  name: string;
  amount: number;
  source: string;
  date: string;
  createdAt: string;
};

type ExpenseRow = {
  id: number;
  name: string;
  amount: number;
  source: string;
  expense_date: string;
  created_at: string;
};

type IncomeRow = {
  appointment_date: string;
  appointment_price: number;
  appointment_tip: null | number;
};

type PlannedAppointmentRow = {
  appointment_date: string;
};

export type CompletedAppointmentIncome = {
  date: string;
  amount: number;
  tip: number;
};

export type ExpenseAmountItem = {
  date: string;
  amount: number;
};

export type PlannedAppointmentIncome = {
  date: string;
};

export type FinanceProjectionSummary = {
  label: string;
  from: string;
  to: string;
  mode: "mixed" | "projected";
  earnedIncome: number;
  estimatedIncome: number;
  unrealizedIncome: number;
  totalIncome: number;
  completedAppointmentCount: number;
  unrealizedAppointmentCount: number;
  estimatedAppointmentCount: number;
};

export type FinanceSummary = {
  todayKey: string;
  completedAppointments: CompletedAppointmentIncome[];
  plannedAppointments: PlannedAppointmentIncome[];
  expenseItems: ExpenseAmountItem[];
  projected: {
    currentWeek: FinanceProjectionSummary;
    nextWeek: FinanceProjectionSummary;
    currentMonth: FinanceProjectionSummary;
    averageIncomeLastMonth: number;
  };
  recentExpenses: Expense[];
};

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

function getStartOfWeek(date: Date) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  return start;
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

function createProjectionSummary(input: {
  label: string;
  from: string;
  to: string;
  mode: "mixed" | "projected";
  earnedIncome: number;
  completedAppointmentCount: number;
  unrealizedAppointmentCount: number;
  averageIncomeLastMonth: number;
}) {
  const estimatedAppointmentCount =
    input.completedAppointmentCount + input.unrealizedAppointmentCount;
  const estimatedIncome = Math.round(
    estimatedAppointmentCount * input.averageIncomeLastMonth,
  );
  const unrealizedIncome = Math.round(
    input.unrealizedAppointmentCount * input.averageIncomeLastMonth,
  );

  return {
    label: input.label,
    from: input.from,
    to: input.to,
    mode: input.mode,
    earnedIncome: input.earnedIncome,
    estimatedIncome,
    unrealizedIncome,
    totalIncome: input.earnedIncome + unrealizedIncome,
    completedAppointmentCount: input.completedAppointmentCount,
    unrealizedAppointmentCount: input.unrealizedAppointmentCount,
    estimatedAppointmentCount,
  };
}

export async function getFinanceSummary(): Promise<FinanceSummary> {
  const supabase = await createClient();
  const todayKey = getTodayDateKey();
  const today = new Date(`${todayKey}T12:00:00`);
  const startOfWeek = getStartOfWeek(today);
  const endOfWeek = addDays(startOfWeek, 6);
  const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const startOfNextWeek = addDays(startOfWeek, 7);
  const endOfNextWeek = addDays(startOfNextWeek, 6);
  const monthAgoKey = toDateKey(addDays(today, -30));

  const [incomeResponse, expenseResponse, plannedAppointmentsResponse] = await Promise.all([
    supabase
      .from("appointments")
      .select("appointment_date, appointment_price, appointment_tip")
      .eq("status", "completed")
      .is("deleted_at", null)
      .order("appointment_date", { ascending: true }),
    supabase
      .from("expenses")
      .select("id, name, amount, source, expense_date, created_at")
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("appointments")
      .select("appointment_date")
      .in("status", ["confirmed", "scheduled"])
      .is("deleted_at", null)
      .order("appointment_date", { ascending: true }),
  ]);

  if (incomeResponse.error) {
    throw new Error(`Failed to load income summary: ${incomeResponse.error.message}`);
  }

  if (expenseResponse.error) {
    throw new Error(`Failed to load expenses: ${expenseResponse.error.message}`);
  }

  if (plannedAppointmentsResponse.error) {
    throw new Error(
      `Failed to load projected appointments: ${plannedAppointmentsResponse.error.message}`,
    );
  }

  const completedAppointments = ((incomeResponse.data ?? []) as IncomeRow[]).map((item) => ({
    date: item.appointment_date,
    amount: item.appointment_price + (item.appointment_tip ?? 0),
    tip: item.appointment_tip ?? 0,
  }));
  const recentExpenses = ((expenseResponse.data ?? []) as ExpenseRow[]).map((item) => ({
    id: item.id,
    name: item.name,
    amount: item.amount,
    source: item.source,
    date: item.expense_date,
    createdAt: item.created_at,
  }));
  const expenseItems = recentExpenses.map((expense) => ({
    date: expense.date,
    amount: expense.amount,
  }));
  const plannedAppointments = ((plannedAppointmentsResponse.data ?? []) as PlannedAppointmentRow[]).map(
    (item) => ({
      date: item.appointment_date,
    }),
  );

  const recentCompletedAppointments = completedAppointments.filter(
    (appointment) => appointment.date >= monthAgoKey && appointment.date <= todayKey,
  );
  const averageIncomeLastMonth =
    recentCompletedAppointments.length > 0
      ? Math.round(
          recentCompletedAppointments.reduce(
            (total, appointment) => total + appointment.amount,
            0,
          ) / recentCompletedAppointments.length,
        )
      : 0;

  const currentWeekFrom = toDateKey(startOfWeek);
  const currentWeekTo = toDateKey(endOfWeek);
  const currentMonthFrom = toDateKey(startOfCurrentMonth);
  const currentMonthTo = toDateKey(endOfCurrentMonth);
  const nextWeekFrom = toDateKey(startOfNextWeek);
  const nextWeekTo = toDateKey(endOfNextWeek);

  return {
    todayKey,
    completedAppointments,
    plannedAppointments,
    expenseItems,
    projected: {
      currentWeek: createProjectionSummary({
        label: "Ten tydzień",
        from: currentWeekFrom,
        to: currentWeekTo,
        mode: "mixed",
        earnedIncome: sumInRange(completedAppointments, currentWeekFrom, todayKey),
        completedAppointmentCount: countInRange(
          completedAppointments,
          currentWeekFrom,
          currentWeekTo,
        ),
        unrealizedAppointmentCount: countInRange(
          plannedAppointments,
          currentWeekFrom,
          currentWeekTo,
        ),
        averageIncomeLastMonth,
      }),
      nextWeek: createProjectionSummary({
        label: "Następny tydzień",
        from: nextWeekFrom,
        to: nextWeekTo,
        mode: "projected",
        earnedIncome: 0,
        completedAppointmentCount: 0,
        unrealizedAppointmentCount: countInRange(plannedAppointments, nextWeekFrom, nextWeekTo),
        averageIncomeLastMonth,
      }),
      currentMonth: createProjectionSummary({
        label: "Ten miesiąc",
        from: currentMonthFrom,
        to: currentMonthTo,
        mode: "mixed",
        earnedIncome: sumInRange(completedAppointments, currentMonthFrom, todayKey),
        completedAppointmentCount: countInRange(
          completedAppointments,
          currentMonthFrom,
          currentMonthTo,
        ),
        unrealizedAppointmentCount: countInRange(
          plannedAppointments,
          currentMonthFrom,
          currentMonthTo,
        ),
        averageIncomeLastMonth,
      }),
      averageIncomeLastMonth,
    },
    recentExpenses: recentExpenses.slice(0, 6),
  };
}

export async function createExpense(input: {
  name: string;
  amount: number;
  source: string;
  date: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").insert({
    name: input.name,
    amount: input.amount,
    source: input.source,
    expense_date: input.date,
  });

  if (error) {
    throw new Error(`Failed to create expense: ${error.message}`);
  }
}

export async function deleteExpense(id: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete expense: ${error.message}`);
  }
}
