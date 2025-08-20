import { db } from '../db';
import { expensesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Expense } from '../schema';

export const getExpenseById = async (id: number): Promise<Expense | null> => {
  try {
    // Query expense by ID
    const results = await db.select()
      .from(expensesTable)
      .where(eq(expensesTable.id, id))
      .execute();

    // Return null if expense not found
    if (results.length === 0) {
      return null;
    }

    const expense = results[0];
    
    // Convert numeric field back to number and return
    return {
      ...expense,
      amount: parseFloat(expense.amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Get expense by ID failed:', error);
    throw error;
  }
};