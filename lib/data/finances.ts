import { createClient } from "../../utils/supabase/server";

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
};

export type FinancePeriodSummary = {
  label: string;
  income: number;
  expenses: number;
  profit: number;
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
  incomes: Array<{ date: string; amount: number }>,
  expenses: Array<{ date: string; amount: number }>,
  from: string,
  to: string,
): FinancePeriodSummary {
  const income = sumInRange(incomes, from, to);
  const expenseTotal = sumInRange(expenses, from, to);

  return {
    label,
    income,
    expenses: expenseTotal,
    profit: income - expenseTotal,
  };
}

export async function getFinanceSummary(): Promise<FinanceSummary> {
  const supabase = await createClient();
  const today = new Date();
  const todayKey = toDateKey(today);
  const startOfWeekKey = toDateKey(getStartOfWeek(today));
  const startOfMonthKey = toDateKey(new Date(today.getFullYear(), today.getMonth(), 1));
  const endOfMonthKey = toDateKey(new Date(today.getFullYear(), today.getMonth() + 1, 0));
  const startOfYearKey = toDateKey(new Date(today.getFullYear(), 0, 1));
  const endOfYearKey = toDateKey(new Date(today.getFullYear(), 11, 31));
  const queryStartKey =
    startOfWeekKey < startOfYearKey ? startOfWeekKey : startOfYearKey;

  const [incomeResponse, expenseResponse] = await Promise.all([
    supabase
      .from("appointments")
      .select("appointment_date, appointment_price")
      .eq("status", "completed")
      .gte("appointment_date", queryStartKey)
      .lte("appointment_date", endOfYearKey),
    supabase
      .from("expenses")
      .select("id, name, amount, source, expense_date, created_at")
      .gte("expense_date", queryStartKey)
      .lte("expense_date", endOfYearKey)
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  if (incomeResponse.error) {
    throw new Error(`Failed to load income summary: ${incomeResponse.error.message}`);
  }

  if (expenseResponse.error) {
    throw new Error(`Failed to load expenses: ${expenseResponse.error.message}`);
  }

  const incomes = ((incomeResponse.data ?? []) as IncomeRow[]).map((item) => ({
    date: item.appointment_date,
    amount: item.appointment_price,
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
