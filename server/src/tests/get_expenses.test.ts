import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { expensesTable } from '../db/schema';
import { type CreateExpenseInput, type ExpenseFilter } from '../schema';
import { getExpenses } from '../handlers/get_expenses';

// Test expense data
const testExpenses: CreateExpenseInput[] = [
  {
    amount: 25.50,
    date: new Date('2024-01-15'),
    description: 'Lunch at restaurant',
    category: 'eat',
    payment_method: 'card'
  },
  {
    amount: 150.00,
    date: new Date('2024-01-20'),
    description: 'Grocery shopping',
    category: 'shop',
    payment_method: 'cash'
  },
  {
    amount: 9.99,
    date: new Date('2024-01-10'),
    description: 'Netflix subscription',
    category: 'subscription',
    payment_method: 'digital_wallet'
  },
  {
    amount: 75.25,
    date: new Date('2024-01-25'),
    description: 'Gas for car',
    category: 'others',
    payment_method: 'card'
  }
];

// Helper function to create test expenses
const createTestExpenses = async () => {
  const results = [];
  for (const expense of testExpenses) {
    const result = await db.insert(expensesTable)
      .values({
        amount: expense.amount.toString(),
        date: expense.date,
        description: expense.description,
        category: expense.category,
        payment_method: expense.payment_method
      })
      .returning()
      .execute();
    results.push(result[0]);
  }
  return results;
};

describe('getExpenses', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all expenses when no filter is provided', async () => {
    await createTestExpenses();

    const result = await getExpenses();

    expect(result).toHaveLength(4);
    
    // Check that results are ordered by date (most recent first)
    expect(result[0].date).toEqual(new Date('2024-01-25'));
    expect(result[1].date).toEqual(new Date('2024-01-20'));
    expect(result[2].date).toEqual(new Date('2024-01-15'));
    expect(result[3].date).toEqual(new Date('2024-01-10'));

    // Verify numeric conversion
    expect(typeof result[0].amount).toBe('number');
    expect(result[0].amount).toBe(75.25);
  });

  it('should return empty array when no expenses exist', async () => {
    const result = await getExpenses();

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should filter by category', async () => {
    await createTestExpenses();

    const filter: ExpenseFilter = {
      category: 'eat'
    };

    const result = await getExpenses(filter);

    expect(result).toHaveLength(1);
    expect(result[0].description).toBe('Lunch at restaurant');
    expect(result[0].category).toBe('eat');
    expect(result[0].amount).toBe(25.50);
  });

  it('should filter by payment method', async () => {
    await createTestExpenses();

    const filter: ExpenseFilter = {
      payment_method: 'card'
    };

    const result = await getExpenses(filter);

    expect(result).toHaveLength(2);
    expect(result.every(expense => expense.payment_method === 'card')).toBe(true);
    
    // Should be ordered by date (most recent first)
    expect(result[0].description).toBe('Gas for car');
    expect(result[1].description).toBe('Lunch at restaurant');
  });

  it('should filter by date range', async () => {
    await createTestExpenses();

    const filter: ExpenseFilter = {
      start_date: new Date('2024-01-12'),
      end_date: new Date('2024-01-22')
    };

    const result = await getExpenses(filter);

    expect(result).toHaveLength(2);
    expect(result[0].description).toBe('Grocery shopping');
    expect(result[1].description).toBe('Lunch at restaurant');
    
    // Verify dates are within range
    result.forEach(expense => {
      expect(expense.date >= new Date('2024-01-12')).toBe(true);
      expect(expense.date <= new Date('2024-01-22')).toBe(true);
    });
  });

  it('should filter by amount range', async () => {
    await createTestExpenses();

    const filter: ExpenseFilter = {
      min_amount: 50,
      max_amount: 200
    };

    const result = await getExpenses(filter);

    expect(result).toHaveLength(2);
    
    // Results should be ordered by date (most recent first)
    // Gas for car (75.25) on 2024-01-25 should be first
    // Grocery shopping (150.00) on 2024-01-20 should be second
    expect(result[0].amount).toBe(75.25);
    expect(result[0].description).toBe('Gas for car');
    expect(result[1].amount).toBe(150.00);
    expect(result[1].description).toBe('Grocery shopping');
    
    // Verify amounts are within range
    result.forEach(expense => {
      expect(expense.amount >= 50).toBe(true);
      expect(expense.amount <= 200).toBe(true);
    });
  });

  it('should handle multiple filters combined', async () => {
    await createTestExpenses();

    const filter: ExpenseFilter = {
      category: 'shop',
      payment_method: 'cash',
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31'),
      min_amount: 100
    };

    const result = await getExpenses(filter);

    expect(result).toHaveLength(1);
    expect(result[0].description).toBe('Grocery shopping');
    expect(result[0].category).toBe('shop');
    expect(result[0].payment_method).toBe('cash');
    expect(result[0].amount).toBe(150.00);
  });

  it('should return empty array when filters match no expenses', async () => {
    await createTestExpenses();

    const filter: ExpenseFilter = {
      category: 'eat',
      min_amount: 1000 // No expense has amount >= 1000
    };

    const result = await getExpenses(filter);

    expect(result).toHaveLength(0);
  });

  it('should handle edge case filters correctly', async () => {
    await createTestExpenses();

    // Test exact amount match
    const exactAmountFilter: ExpenseFilter = {
      min_amount: 9.99,
      max_amount: 9.99
    };

    const exactResult = await getExpenses(exactAmountFilter);
    expect(exactResult).toHaveLength(1);
    expect(exactResult[0].description).toBe('Netflix subscription');

    // Test start_date only
    const startDateFilter: ExpenseFilter = {
      start_date: new Date('2024-01-20')
    };

    const startDateResult = await getExpenses(startDateFilter);
    expect(startDateResult).toHaveLength(2);
    expect(startDateResult.every(expense => expense.date >= new Date('2024-01-20'))).toBe(true);

    // Test end_date only
    const endDateFilter: ExpenseFilter = {
      end_date: new Date('2024-01-15')
    };

    const endDateResult = await getExpenses(endDateFilter);
    expect(endDateResult).toHaveLength(2);
    expect(endDateResult.every(expense => expense.date <= new Date('2024-01-15'))).toBe(true);
  });

  it('should preserve all expense fields correctly', async () => {
    await createTestExpenses();

    const result = await getExpenses();

    expect(result).toHaveLength(4);
    
    // Check first expense has all required fields
    const expense = result[0];
    expect(expense.id).toBeDefined();
    expect(typeof expense.amount).toBe('number');
    expect(expense.date).toBeInstanceOf(Date);
    expect(typeof expense.description).toBe('string');
    expect(expense.category).toBeDefined();
    expect(expense.payment_method).toBeDefined();
    expect(expense.created_at).toBeInstanceOf(Date);
    expect(expense.updated_at).toBeInstanceOf(Date);
  });
});