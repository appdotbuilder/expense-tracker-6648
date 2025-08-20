import { db } from '../db';
import { expensesTable } from '../db/schema';
import { type CreateExpenseInput, type Expense } from '../schema';

export const createExpense = async (input: CreateExpenseInput): Promise<Expense> => {
  try {
    // Insert expense record
    const result = await db.insert(expensesTable)
      .values({
        amount: input.amount.toString(), // Convert number to string for numeric column
        date: input.date,
        description: input.description,
        category: input.category,
        payment_method: input.payment_method
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const expense = result[0];
    return {
      ...expense,
      amount: parseFloat(expense.amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Expense creation failed:', error);
    throw error;
  }
};