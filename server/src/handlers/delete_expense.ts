import { db } from '../db';
import { expensesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteExpense = async (id: number): Promise<boolean> => {
  try {
    // Delete expense record by ID
    const result = await db.delete(expensesTable)
      .where(eq(expensesTable.id, id))
      .returning()
      .execute();

    // Return true if expense was found and deleted, false otherwise
    return result.length > 0;
  } catch (error) {
    console.error('Expense deletion failed:', error);
    throw error;
  }
};