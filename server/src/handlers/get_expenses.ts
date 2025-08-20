import { db } from '../db';
import { expensesTable } from '../db/schema';
import { type Expense, type ExpenseFilter } from '../schema';
import { eq, gte, lte, and, desc } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export const getExpenses = async (filter?: ExpenseFilter): Promise<Expense[]> => {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (filter) {
      // Category filter
      if (filter.category) {
        conditions.push(eq(expensesTable.category, filter.category));
      }

      // Payment method filter
      if (filter.payment_method) {
        conditions.push(eq(expensesTable.payment_method, filter.payment_method));
      }

      // Date range filters
      if (filter.start_date) {
        conditions.push(gte(expensesTable.date, filter.start_date));
      }

      if (filter.end_date) {
        conditions.push(lte(expensesTable.date, filter.end_date));
      }

      // Amount range filters (need to convert to string for numeric column comparison)
      if (filter.min_amount !== undefined) {
        conditions.push(gte(expensesTable.amount, filter.min_amount.toString()));
      }

      if (filter.max_amount !== undefined) {
        conditions.push(lte(expensesTable.amount, filter.max_amount.toString()));
      }
    }

    // Build final query with all conditions and ordering
    const results = await db.select()
      .from(expensesTable)
      .where(conditions.length > 0 ? (conditions.length === 1 ? conditions[0] : and(...conditions)) : undefined)
      .orderBy(desc(expensesTable.date))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(expense => ({
      ...expense,
      amount: parseFloat(expense.amount) // Convert string back to number
    }));
  } catch (error) {
    console.error('Get expenses failed:', error);
    throw error;
  }
};