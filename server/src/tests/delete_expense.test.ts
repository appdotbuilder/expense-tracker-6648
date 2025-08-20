import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { expensesTable } from '../db/schema';
import { type CreateExpenseInput } from '../schema';
import { deleteExpense } from '../handlers/delete_expense';
import { eq } from 'drizzle-orm';

// Test expense data
const testExpenseInput: CreateExpenseInput = {
  amount: 25.99,
  date: new Date('2023-12-01'),
  description: 'Test expense for deletion',
  category: 'eat',
  payment_method: 'card'
};

const createTestExpense = async (expenseData: CreateExpenseInput) => {
  const result = await db.insert(expensesTable)
    .values({
      amount: expenseData.amount.toString(), // Convert number to string for numeric column
      date: expenseData.date,
      description: expenseData.description,
      category: expenseData.category,
      payment_method: expenseData.payment_method
    })
    .returning()
    .execute();

  return result[0];
};

describe('deleteExpense', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing expense and return true', async () => {
    // Create test expense
    const createdExpense = await createTestExpense(testExpenseInput);
    
    // Delete the expense
    const result = await deleteExpense(createdExpense.id);

    // Should return true
    expect(result).toBe(true);

    // Verify expense is deleted from database
    const expenses = await db.select()
      .from(expensesTable)
      .where(eq(expensesTable.id, createdExpense.id))
      .execute();

    expect(expenses).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent expense', async () => {
    // Try to delete expense that doesn't exist
    const result = await deleteExpense(99999);

    // Should return false
    expect(result).toBe(false);
  });

  it('should not affect other expenses when deleting one', async () => {
    // Create multiple test expenses
    const expense1 = await createTestExpense({
      ...testExpenseInput,
      description: 'First expense'
    });
    
    const expense2 = await createTestExpense({
      ...testExpenseInput,
      description: 'Second expense',
      amount: 15.50
    });

    // Delete only the first expense
    const result = await deleteExpense(expense1.id);

    // Should return true
    expect(result).toBe(true);

    // Verify first expense is deleted
    const deletedExpense = await db.select()
      .from(expensesTable)
      .where(eq(expensesTable.id, expense1.id))
      .execute();

    expect(deletedExpense).toHaveLength(0);

    // Verify second expense still exists
    const remainingExpense = await db.select()
      .from(expensesTable)
      .where(eq(expensesTable.id, expense2.id))
      .execute();

    expect(remainingExpense).toHaveLength(1);
    expect(remainingExpense[0].description).toBe('Second expense');
    expect(parseFloat(remainingExpense[0].amount)).toBe(15.50);
  });

  it('should handle deletion of expense with different categories', async () => {
    // Create expenses with different categories
    const shopExpense = await createTestExpense({
      ...testExpenseInput,
      category: 'shop',
      description: 'Shopping expense'
    });

    const subscriptionExpense = await createTestExpense({
      ...testExpenseInput,
      category: 'subscription',
      description: 'Subscription expense'
    });

    // Delete shop expense
    const result1 = await deleteExpense(shopExpense.id);
    expect(result1).toBe(true);

    // Delete subscription expense
    const result2 = await deleteExpense(subscriptionExpense.id);
    expect(result2).toBe(true);

    // Verify both are deleted
    const allExpenses = await db.select().from(expensesTable).execute();
    expect(allExpenses).toHaveLength(0);
  });

  it('should handle deletion of expense with different payment methods', async () => {
    // Create expenses with different payment methods
    const cashExpense = await createTestExpense({
      ...testExpenseInput,
      payment_method: 'cash',
      description: 'Cash expense'
    });

    const bankExpense = await createTestExpense({
      ...testExpenseInput,
      payment_method: 'bank_transfer',
      description: 'Bank transfer expense'
    });

    // Delete cash expense
    const result1 = await deleteExpense(cashExpense.id);
    expect(result1).toBe(true);

    // Verify cash expense is deleted but bank expense remains
    const remainingExpenses = await db.select().from(expensesTable).execute();
    expect(remainingExpenses).toHaveLength(1);
    expect(remainingExpenses[0].description).toBe('Bank transfer expense');
    expect(remainingExpenses[0].payment_method).toBe('bank_transfer');
  });
});