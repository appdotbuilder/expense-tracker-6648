import { db } from '../db';
import { expensesTable } from '../db/schema';
import { type UpdateExpenseInput, type Expense } from '../schema';
import { eq } from 'drizzle-orm';

export const updateExpense = async (input: UpdateExpenseInput): Promise<Expense> => {
  try {
    // First, check if the expense exists
    const existingExpense = await db.select()
      .from(expensesTable)
      .where(eq(expensesTable.id, input.id))
      .execute();

    if (existingExpense.length === 0) {
      throw new Error(`Expense with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date() // Always update the timestamp
    };

    if (input.amount !== undefined) {
      updateData.amount = input.amount.toString(); // Convert number to string for numeric column
    }

    if (input.date !== undefined) {
      updateData.date = input.date;
    }

    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    if (input.category !== undefined) {
      updateData.category = input.category;
    }

    if (input.payment_method !== undefined) {
      updateData.payment_method = input.payment_method;
    }

    // Update the expense record
    const result = await db.update(expensesTable)
      .set(updateData)
      .where(eq(expensesTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const updatedExpense = result[0];
    return {
      ...updatedExpense,
      amount: parseFloat(updatedExpense.amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Expense update failed:', error);
    throw error;
  }
};