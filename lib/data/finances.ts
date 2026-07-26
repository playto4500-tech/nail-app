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

type FutureAppointmentRow = {
  appointment_date: string;
  appointment_price: null | number;
  service_id: null | number;
};

type ServicePriceRow = {
  id: number;
  price: number;
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

export type FinanceProjectionSummary = {
  label: string;
  from: string;
  to: string;
  earnedIncome: number;
  projectedIncome: number;
  totalIncome: number;
};

export type FinanceSummary = {
  todayKey: string;
  completedAppointments: CompletedAppointmentIncome[];
  expenseItems: ExpenseAmountItem[];
  projected: {
    nextWeek: FinanceProjectionSummary;
    monthEnd: FinanceProjectionSummary;
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

function estimateFutureIncome(
  appointments: FutureAppointmentRow[],
  servicePrices: Map<number, number>,
  from: string,
  to: string,
) {
  return appointments.reduce((total, appointment) => {
    if (appointment.appointment_date < from || appointment.appointment_date > to) {
      return total;
    }

    if (typeof appointment.appointment_price === "number") {
      return total + appointment.appointment_price;
    }

    if (appointment.service_id) {
      return total + (servicePrices.get(appointment.service_id) ?? 0);
    }

    return total;
  }, 0);
}

export async function getFinanceSummary(): Promise<FinanceSummary> {
  const supabase = await createClient();
  const today = new Date();
  const todayKey = getTodayDateKey(today);
  const startOfWeek = getStartOfWeek(today);
  const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const startOfNextWeek = addDays(startOfWeek, 7);
  const endOfNextWeek = addDays(startOfNextWeek, 6);

  const [incomeResponse, expenseResponse, futureAppointmentsResponse, servicesResponse] =
    await Promise.all([
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
        .select("appointment_date, appointment_price, service_id")
        .in("status", ["confirmed", "scheduled"])
        .is("deleted_at", null)
        .gte("appointment_date", todayKey),
      supabase.from("services").select("id, price"),
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

  if (servicesResponse.error) {
    throw new Error(`Failed to load services for forecast: ${servicesResponse.error.message}`);
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
  const futureAppointments = (futureAppointmentsResponse.data ?? []) as FutureAppointmentRow[];
  const servicePrices = new Map(
    ((servicesResponse.data ?? []) as ServicePriceRow[]).map((service) => [
      service.id,
      service.price,
    ]),
  );

  const currentMonthFrom = toDateKey(startOfCurrentMonth);
  const currentMonthTo = toDateKey(endOfCurrentMonth);
  const nextWeekFrom = toDateKey(startOfNextWeek);
  const nextWeekTo = toDateKey(endOfNextWeek);

  const earnedCurrentMonth = sumInRange(completedAppointments, currentMonthFrom, todayKey);
  const projectedCurrentMonth = estimateFutureIncome(
    futureAppointments,
    servicePrices,
    todayKey,
    currentMonthTo,
  );
  const projectedNextWeek = estimateFutureIncome(
    futureAppointments,
    servicePrices,
    nextWeekFrom,
    nextWeekTo,
  );

  return {
    todayKey,
    completedAppointments,
    expenseItems,
    projected: {
      nextWeek: {
        label: "Następny tydzień",
        from: nextWeekFrom,
        to: nextWeekTo,
        earnedIncome: 0,
        projectedIncome: projectedNextWeek,
        totalIncome: projectedNextWeek,
      },
      monthEnd: {
        label: "Do końca miesiąca",
        from: currentMonthFrom,
        to: currentMonthTo,
        earnedIncome: earnedCurrentMonth,
        projectedIncome: projectedCurrentMonth,
        totalIncome: earnedCurrentMonth + projectedCurrentMonth,
      },
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
