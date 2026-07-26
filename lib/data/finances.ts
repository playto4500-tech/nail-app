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
  deleted_at: null | string;
};

type FutureAppointmentRow = {
  appointment_date: string;
  deleted_at: null | string;
  status: string;
};

type IncomeItem = {
  date: string;
  amount: number;
  tip: number;
};

export type FinancePeriodSummary = {
  label: string;
  income: number;
  expenses: number;
  profit: number;
  appointmentCount: number;
  averageAppointmentIncome: number;
  tipTotal: number;
  averageTip: number;
  tippedAppointmentCount: number;
  tipRate: number;
};

export type MonthlyFinanceSummary = FinancePeriodSummary & {
  monthKey: string;
};

export type FinanceSummary = {
  today: FinancePeriodSummary;
  week: FinancePeriodSummary;
  month: FinancePeriodSummary;
  year: FinancePeriodSummary;
  months: MonthlyFinanceSummary[];
  projected: {
    upcomingAppointmentCount: number;
    averageIncomeLast30Days: number;
    estimatedIncome: number;
  };
  recentExpenses: Expense[];
};

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getStartOfWeek(date: Date) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  return start;
}

function getMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const label = new Intl.DateTimeFormat("pl-PL", {
    month: "long",
  }).format(new Date(year, month - 1, 1));

  return label.charAt(0).toUpperCase() + label.slice(1);
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

function createPeriodSummary(
  label: string,
  incomes: IncomeItem[],
  expenses: Array<{ date: string; amount: number }>,
  from: string,
  to: string,
): FinancePeriodSummary {
  const periodIncomes = incomes.filter((item) => item.date >= from && item.date <= to);
  const income = periodIncomes.reduce((total, item) => total + item.amount, 0);
  const expenseTotal = sumInRange(expenses, from, to);
  const appointmentCount = periodIncomes.length;
  const tipTotal = periodIncomes.reduce((total, item) => total + item.tip, 0);
  const tippedAppointmentCount = periodIncomes.filter((item) => item.tip > 0).length;

  return {
    label,
    income,
    expenses: expenseTotal,
    profit: income - expenseTotal,
    appointmentCount,
    averageAppointmentIncome:
      appointmentCount > 0 ? Math.round(income / appointmentCount) : 0,
    tipTotal,
    averageTip:
      tippedAppointmentCount > 0 ? Math.round(tipTotal / tippedAppointmentCount) : 0,
    tippedAppointmentCount,
    tipRate:
      appointmentCount > 0
        ? Math.round((tippedAppointmentCount / appointmentCount) * 100)
        : 0,
  };
}

export async function getFinanceSummary(): Promise<FinanceSummary> {
  const supabase = await createClient();
  const today = new Date();
  const todayKey = getTodayDateKey(today);
  const startOfWeekKey = toDateKey(getStartOfWeek(today));
  const startOfMonthKey = toDateKey(new Date(today.getFullYear(), today.getMonth(), 1));
  const endOfMonthKey = toDateKey(new Date(today.getFullYear(), today.getMonth() + 1, 0));
  const startOfYearKey = toDateKey(new Date(today.getFullYear(), 0, 1));
  const endOfYearKey = toDateKey(new Date(today.getFullYear(), 11, 31));
  const thirtyDaysAgoKey = toDateKey(
    new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30),
  );
  const queryStartKey =
    thirtyDaysAgoKey < startOfYearKey ? thirtyDaysAgoKey : startOfYearKey;

  const [incomeResponse, expenseResponse, futureAppointmentsResponse] = await Promise.all([
    supabase
      .from("appointments")
      .select("appointment_date, appointment_price, appointment_tip, deleted_at")
      .eq("status", "completed")
      .is("deleted_at", null)
      .gte("appointment_date", queryStartKey)
      .lte("appointment_date", endOfYearKey),
    supabase
      .from("expenses")
      .select("id, name, amount, source, expense_date, created_at")
      .gte("expense_date", queryStartKey)
      .lte("expense_date", endOfYearKey)
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("appointments")
      .select("appointment_date, status, deleted_at")
      .in("status", ["confirmed", "scheduled"])
      .is("deleted_at", null)
      .gte("appointment_date", todayKey),
  ]);

  if (incomeResponse.error) {
    throw new Error(`Failed to load income summary: ${incomeResponse.error.message}`);
  }

  if (expenseResponse.error) {
    throw new Error(`Failed to load expenses: ${expenseResponse.error.message}`);
  }

  if (futureAppointmentsResponse.error) {
    throw new Error(
      `Failed to load projected appointments: ${futureAppointmentsResponse.error.message}`,
    );
  }

  const incomes = ((incomeResponse.data ?? []) as IncomeRow[]).map((item) => ({
    date: item.appointment_date,
    amount: item.appointment_price + (item.appointment_tip ?? 0),
    tip: item.appointment_tip ?? 0,
  }));
  const expenses = ((expenseResponse.data ?? []) as ExpenseRow[]).map((item) => ({
    id: item.id,
    name: item.name,
    amount: item.amount,
    source: item.source,
    date: item.expense_date,
    createdAt: item.created_at,
  }));
  const expenseAmounts = expenses.map((expense) => ({
    date: expense.date,
    amount: expense.amount,
  }));
  const recentIncomes = incomes.filter((income) => income.date >= thirtyDaysAgoKey);
  const averageIncomeLast30Days =
    recentIncomes.length > 0
      ? Math.round(
          recentIncomes.reduce((total, income) => total + income.amount, 0) /
            recentIncomes.length,
        )
      : 0;
  const upcomingAppointmentCount = (
    (futureAppointmentsResponse.data ?? []) as FutureAppointmentRow[]
  ).length;

  const months = Array.from({ length: today.getMonth() + 1 }, (_, index) => {
    const monthDate = new Date(today.getFullYear(), index, 1);
    const monthKey = `${monthDate.getFullYear()}-${String(index + 1).padStart(2, "0")}`;
    const from = toDateKey(monthDate);
    const to = toDateKey(new Date(today.getFullYear(), index + 1, 0));

    return {
      monthKey,
      ...createPeriodSummary(
        getMonthLabel(monthKey),
        incomes,
        expenseAmounts,
        from,
        to,
      ),
    };
  }).reverse();

  return {
    today: createPeriodSummary("Dzisiaj", incomes, expenseAmounts, todayKey, todayKey),
    week: createPeriodSummary(
      "Ten tydzień",
      incomes,
      expenseAmounts,
      startOfWeekKey,
      todayKey,
    ),
    month: createPeriodSummary(
      "Ten miesiąc",
      incomes,
      expenseAmounts,
      startOfMonthKey,
      endOfMonthKey,
    ),
    year: createPeriodSummary(
      "Ten rok",
      incomes,
      expenseAmounts,
      startOfYearKey,
      endOfYearKey,
    ),
    months,
    projected: {
      upcomingAppointmentCount,
      averageIncomeLast30Days,
      estimatedIncome: upcomingAppointmentCount * averageIncomeLast30Days,
    },
    recentExpenses: expenses.slice(0, 6),
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
