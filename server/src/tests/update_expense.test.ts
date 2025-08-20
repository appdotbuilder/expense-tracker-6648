import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { expensesTable } from '../db/schema';
import { type CreateExpenseInput, type UpdateExpenseInput } from '../schema';
import { updateExpense } from '../handlers/update_expense';
import { eq } from 'drizzle-orm';

// Helper function to create a test expense
const createTestExpense = async () => {
  const testExpenseData = {
    amount: '100.50',
    date: new Date('2024-01-15'),
    description: 'Original test expense',
    category: 'eat' as const,
    payment_method: 'card' as const
  };

  const result = await db.insert(expensesTable)
    .values(testExpenseData)
    .returning()
    .execute();

  return result[0];
};

describe('updateExpense', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all expense fields', async () => {
    const originalExpense = await createTestExpense();
    
    const updateInput: UpdateExpenseInput = {
      id: originalExpense.id,
      amount: 250.75,
      date: new Date('2024-02-01'),
      description: 'Updated expense description',
      category: 'shop',
      payment_method: 'cash'
    };

    const result = await updateExpense(updateInput);

    // Verify all fields were updated
    expect(result.id).toBe(originalExpense.id);
    expect(result.amount).toBe(250.75);
    expect(result.date).toEqual(new Date('2024-02-01'));
    expect(result.description).toBe('Updated expense description');
    expect(result.category).toBe('shop');
    expect(result.payment_method).toBe('cash');
    expect(result.created_at).toEqual(originalExpense.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > originalExpense.updated_at).toBe(true);
  });

  it('should update only provided fields', async () => {
    const originalExpense = await createTestExpense();
    
    const updateInput: UpdateExpenseInput = {
      id: originalExpense.id,
      amount: 150.25,
      description: 'Partially updated expense'
    };

    const result = await updateExpense(updateInput);

    // Verify only specified fields were updated
    expect(result.id).toBe(originalExpense.id);
    expect(result.amount).toBe(150.25);
    expect(result.description).toBe('Partially updated expense');
    
    // These fields should remain unchanged
    expect(result.date).toEqual(originalExpense.date);
    expect(result.category).toBe(originalExpense.category);
    expect(result.payment_method).toBe(originalExpense.payment_method);
    expect(result.created_at).toEqual(originalExpense.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > originalExpense.updated_at).toBe(true);
  });

  it('should update single field correctly', async () => {
    const originalExpense = await createTestExpense();
    
    const updateInput: UpdateExpenseInput = {
      id: originalExpense.id,
      category: 'subscription'
    };

    const result = await updateExpense(updateInput);

    // Verify only category was updated
    expect(result.category).toBe('subscription');
    expect(result.amount).toBe(parseFloat(originalExpense.amount));
    expect(result.description).toBe(originalExpense.description);
    expect(result.payment_method).toBe(originalExpense.payment_method);
    expect(result.updated_at > originalExpense.updated_at).toBe(true);
  });

  it('should save updated expense to database', async () => {
    const originalExpense = await createTestExpense();
    
    const updateInput: UpdateExpenseInput = {
      id: originalExpense.id,
      amount: 75.99,
      description: 'Database update test'
    };

    await updateExpense(updateInput);

    // Query database directly to verify changes were persisted
    const savedExpenses = await db.select()
      .from(expensesTable)
      .where(eq(expensesTable.id, originalExpense.id))
      .execute();

    expect(savedExpenses).toHaveLength(1);
    const savedExpense = savedExpenses[0];
    expect(parseFloat(savedExpense.amount)).toBe(75.99);
    expect(savedExpense.description).toBe('Database update test');
    expect(savedExpense.category).toBe(originalExpense.category); // Unchanged
    expect(savedExpense.updated_at).toBeInstanceOf(Date);
    expect(savedExpense.updated_at > originalExpense.updated_at).toBe(true);
  });

  it('should throw error when expense does not exist', async () => {
    const updateInput: UpdateExpenseInput = {
      id: 99999, // Non-existent ID
      amount: 100.00,
      description: 'This should fail'
    };

    expect(updateExpense(updateInput)).rejects.toThrow(/expense with id 99999 not found/i);
  });

  it('should handle decimal amounts correctly', async () => {
    const originalExpense = await createTestExpense();
    
    const updateInput: UpdateExpenseInput = {
      id: originalExpense.id,
      amount: 99.99
    };

    const result = await updateExpense(updateInput);

    expect(result.amount).toBe(99.99);
    expect(typeof result.amount).toBe('number');

    // Verify in database
    const savedExpenses = await db.select()
      .from(expensesTable)
      .where(eq(expensesTable.id, originalExpense.id))
      .execute();

    expect(parseFloat(savedExpenses[0].amount)).toBe(99.99);
  });

  it('should always update the updated_at timestamp', async () => {
    const originalExpense = await createTestExpense();
    const originalUpdateTime = originalExpense.updated_at;
    
    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const updateInput: UpdateExpenseInput = {
      id: originalExpense.id,
      description: 'Timestamp test'
    };

    const result = await updateExpense(updateInput);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > originalUpdateTime).toBe(true);
  });

  it('should preserve created_at timestamp', async () => {
    const originalExpense = await createTestExpense();
    
    const updateInput: UpdateExpenseInput = {
      id: originalExpense.id,
      amount: 200.00,
      description: 'Preserve created_at test'
    };

    const result = await updateExpense(updateInput);

    expect(result.created_at).toEqual(originalExpense.created_at);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should handle date updates correctly', async () => {
    const originalExpense = await createTestExpense();
    const newDate = new Date('2024-12-25');
    
    const updateInput: UpdateExpenseInput = {
      id: originalExpense.id,
      date: newDate
    };

    const result = await updateExpense(updateInput);

    expect(result.date).toEqual(newDate);
    expect(result.date).toBeInstanceOf(Date);

    // Verify in database
    const savedExpenses = await db.select()
      .from(expensesTable)
      .where(eq(expensesTable.id, originalExpense.id))
      .execute();

    expect(savedExpenses[0].date).toEqual(newDate);
  });
});