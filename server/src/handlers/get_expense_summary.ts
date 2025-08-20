import { db } from '../db';
import { expensesTable } from '../db/schema';
import { type ExpenseSummary, type SummaryInput, type ExpenseCategory, type PaymentMethod } from '../schema';
import { eq, gte, lte, and, sql, type SQL } from 'drizzle-orm';

export const getExpenseSummary = async (input?: SummaryInput): Promise<ExpenseSummary> => {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    // Apply filters if provided
    if (input?.start_date) {
      conditions.push(gte(expensesTable.date, input.start_date));
    }

    if (input?.end_date) {
      conditions.push(lte(expensesTable.date, input.end_date));
    }

    if (input?.category) {
      conditions.push(eq(expensesTable.category, input.category));
    }

    if (input?.payment_method) {
      conditions.push(eq(expensesTable.payment_method, input.payment_method));
    }

    // Build query with or without where clause
    const expenses = conditions.length > 0
      ? await db.select().from(expensesTable).where(and(...conditions)).execute()
      : await db.select().from(expensesTable).execute();

    // Convert numeric fields from strings to numbers
    const processedExpenses = expenses.map(expense => ({
      ...expense,
      amount: parseFloat(expense.amount)
    }));

    // Calculate summary statistics
    const total_amount = processedExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const total_count = processedExpenses.length;
    const average_amount = total_count > 0 ? total_amount / total_count : 0;

    // Calculate breakdowns by category
    const by_category: Record<ExpenseCategory, { total_amount: number; count: number }> = {} as any;
    
    // Calculate breakdowns by payment method
    const by_payment_method: Record<PaymentMethod, { total_amount: number; count: number }> = {} as any;

    processedExpenses.forEach(expense => {
      // Category breakdown
      if (!by_category[expense.category]) {
        by_category[expense.category] = { total_amount: 0, count: 0 };
      }
      by_category[expense.category].total_amount += expense.amount;
      by_category[expense.category].count += 1;

      // Payment method breakdown
      if (!by_payment_method[expense.payment_method]) {
        by_payment_method[expense.payment_method] = { total_amount: 0, count: 0 };
      }
      by_payment_method[expense.payment_method].total_amount += expense.amount;
      by_payment_method[expense.payment_method].count += 1;
    });

    // Determine the period covered
    let start_date: Date;
    let end_date: Date;

    if (processedExpenses.length > 0) {
      // Use the actual date range from the data
      const dates = processedExpenses.map(e => e.date);
      start_date = new Date(Math.min(...dates.map(d => d.getTime())));
      end_date = new Date(Math.max(...dates.map(d => d.getTime())));
    } else {
      // Use provided dates or default to today
      start_date = input?.start_date || new Date();
      end_date = input?.end_date || new Date();
    }

    return {
      total_amount,
      total_count,
      average_amount,
      by_category,
      by_payment_method,
      period: {
        start_date,
        end_date
      }
    };
  } catch (error) {
    console.error('Expense summary generation failed:', error);
    throw error;
  }
};