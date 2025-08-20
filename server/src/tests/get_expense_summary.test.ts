import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { expensesTable } from '../db/schema';
import { type SummaryInput, type CreateExpenseInput } from '../schema';
import { getExpenseSummary } from '../handlers/get_expense_summary';

// Helper function to create test expense
const createTestExpense = async (expense: CreateExpenseInput) => {
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

  return result[0];
};

describe('getExpenseSummary', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty summary when no expenses exist', async () => {
    const result = await getExpenseSummary();

    expect(result.total_amount).toEqual(0);
    expect(result.total_count).toEqual(0);
    expect(result.average_amount).toEqual(0);
    expect(Object.keys(result.by_category)).toHaveLength(0);
    expect(Object.keys(result.by_payment_method)).toHaveLength(0);
    expect(result.period.start_date).toBeInstanceOf(Date);
    expect(result.period.end_date).toBeInstanceOf(Date);
  });

  it('should calculate basic summary statistics', async () => {
    // Create test expenses
    await createTestExpense({
      amount: 25.50,
      date: new Date('2024-01-15'),
      description: 'Lunch',
      category: 'eat',
      payment_method: 'card'
    });

    await createTestExpense({
      amount: 100.00,
      date: new Date('2024-01-16'),
      description: 'Groceries',
      category: 'shop',
      payment_method: 'cash'
    });

    await createTestExpense({
      amount: 9.99,
      date: new Date('2024-01-17'),
      description: 'Netflix',
      category: 'subscription',
      payment_method: 'card'
    });

    const result = await getExpenseSummary();

    expect(result.total_amount).toEqual(135.49);
    expect(result.total_count).toEqual(3);
    expect(result.average_amount).toBeCloseTo(45.16, 2);
    expect(result.period.start_date).toEqual(new Date('2024-01-15'));
    expect(result.period.end_date).toEqual(new Date('2024-01-17'));
  });

  it('should calculate category breakdowns correctly', async () => {
    // Create multiple expenses in same category
    await createTestExpense({
      amount: 15.00,
      date: new Date('2024-01-15'),
      description: 'Breakfast',
      category: 'eat',
      payment_method: 'card'
    });

    await createTestExpense({
      amount: 25.00,
      date: new Date('2024-01-16'),
      description: 'Lunch',
      category: 'eat',
      payment_method: 'cash'
    });

    await createTestExpense({
      amount: 50.00,
      date: new Date('2024-01-17'),
      description: 'Clothes',
      category: 'shop',
      payment_method: 'card'
    });

    const result = await getExpenseSummary();

    expect(result.by_category.eat).toEqual({
      total_amount: 40.00,
      count: 2
    });

    expect(result.by_category.shop).toEqual({
      total_amount: 50.00,
      count: 1
    });

    expect(result.by_category.subscription).toBeUndefined();
  });

  it('should calculate payment method breakdowns correctly', async () => {
    await createTestExpense({
      amount: 30.00,
      date: new Date('2024-01-15'),
      description: 'Coffee',
      category: 'eat',
      payment_method: 'card'
    });

    await createTestExpense({
      amount: 20.00,
      date: new Date('2024-01-16'),
      description: 'Tip',
      category: 'others',
      payment_method: 'cash'
    });

    await createTestExpense({
      amount: 45.00,
      date: new Date('2024-01-17'),
      description: 'Online purchase',
      category: 'shop',
      payment_method: 'card'
    });

    const result = await getExpenseSummary();

    expect(result.by_payment_method.card).toEqual({
      total_amount: 75.00,
      count: 2
    });

    expect(result.by_payment_method.cash).toEqual({
      total_amount: 20.00,
      count: 1
    });

    expect(result.by_payment_method.bank_transfer).toBeUndefined();
  });

  it('should filter by date range correctly', async () => {
    await createTestExpense({
      amount: 10.00,
      date: new Date('2024-01-10'), // Before range
      description: 'Old expense',
      category: 'eat',
      payment_method: 'card'
    });

    await createTestExpense({
      amount: 25.00,
      date: new Date('2024-01-15'), // In range
      description: 'Current expense',
      category: 'shop',
      payment_method: 'card'
    });

    await createTestExpense({
      amount: 50.00,
      date: new Date('2024-01-25'), // After range
      description: 'Future expense',
      category: 'others',
      payment_method: 'cash'
    });

    const input: SummaryInput = {
      start_date: new Date('2024-01-12'),
      end_date: new Date('2024-01-20')
    };

    const result = await getExpenseSummary(input);

    expect(result.total_amount).toEqual(25.00);
    expect(result.total_count).toEqual(1);
    expect(result.by_category.shop).toEqual({
      total_amount: 25.00,
      count: 1
    });
    expect(result.by_category.eat).toBeUndefined();
    expect(result.by_category.others).toBeUndefined();
  });

  it('should filter by category correctly', async () => {
    await createTestExpense({
      amount: 15.00,
      date: new Date('2024-01-15'),
      description: 'Food',
      category: 'eat',
      payment_method: 'card'
    });

    await createTestExpense({
      amount: 100.00,
      date: new Date('2024-01-16'),
      description: 'Groceries',
      category: 'shop',
      payment_method: 'cash'
    });

    await createTestExpense({
      amount: 20.00,
      date: new Date('2024-01-17'),
      description: 'More food',
      category: 'eat',
      payment_method: 'card'
    });

    const input: SummaryInput = {
      category: 'eat'
    };

    const result = await getExpenseSummary(input);

    expect(result.total_amount).toEqual(35.00);
    expect(result.total_count).toEqual(2);
    expect(result.by_category.eat).toEqual({
      total_amount: 35.00,
      count: 2
    });
    expect(result.by_category.shop).toBeUndefined();
  });

  it('should filter by payment method correctly', async () => {
    await createTestExpense({
      amount: 30.00,
      date: new Date('2024-01-15'),
      description: 'Card payment',
      category: 'eat',
      payment_method: 'card'
    });

    await createTestExpense({
      amount: 20.00,
      date: new Date('2024-01-16'),
      description: 'Cash payment',
      category: 'shop',
      payment_method: 'cash'
    });

    await createTestExpense({
      amount: 45.00,
      date: new Date('2024-01-17'),
      description: 'Another card payment',
      category: 'others',
      payment_method: 'card'
    });

    const input: SummaryInput = {
      payment_method: 'card'
    };

    const result = await getExpenseSummary(input);

    expect(result.total_amount).toEqual(75.00);
    expect(result.total_count).toEqual(2);
    expect(result.by_payment_method.card).toEqual({
      total_amount: 75.00,
      count: 2
    });
    expect(result.by_payment_method.cash).toBeUndefined();
  });

  it('should handle combined filters correctly', async () => {
    await createTestExpense({
      amount: 15.00,
      date: new Date('2024-01-10'),
      description: 'Old food',
      category: 'eat',
      payment_method: 'card'
    });

    await createTestExpense({
      amount: 25.00,
      date: new Date('2024-01-15'),
      description: 'Recent food',
      category: 'eat',
      payment_method: 'card'
    });

    await createTestExpense({
      amount: 100.00,
      date: new Date('2024-01-16'),
      description: 'Shopping',
      category: 'shop',
      payment_method: 'card'
    });

    await createTestExpense({
      amount: 30.00,
      date: new Date('2024-01-17'),
      description: 'Food with cash',
      category: 'eat',
      payment_method: 'cash'
    });

    const input: SummaryInput = {
      start_date: new Date('2024-01-12'),
      end_date: new Date('2024-01-20'),
      category: 'eat',
      payment_method: 'card'
    };

    const result = await getExpenseSummary(input);

    expect(result.total_amount).toEqual(25.00);
    expect(result.total_count).toEqual(1);
    expect(result.by_category.eat).toEqual({
      total_amount: 25.00,
      count: 1
    });
    expect(result.by_payment_method.card).toEqual({
      total_amount: 25.00,
      count: 1
    });
  });

  it('should handle decimal amounts correctly', async () => {
    await createTestExpense({
      amount: 12.34,
      date: new Date('2024-01-15'),
      description: 'Decimal test 1',
      category: 'eat',
      payment_method: 'card'
    });

    await createTestExpense({
      amount: 56.78,
      date: new Date('2024-01-16'),
      description: 'Decimal test 2',
      category: 'shop',
      payment_method: 'cash'
    });

    const result = await getExpenseSummary();

    expect(result.total_amount).toEqual(69.12);
    expect(result.total_count).toEqual(2);
    expect(result.average_amount).toEqual(34.56);
    expect(typeof result.total_amount).toBe('number');
    expect(typeof result.average_amount).toBe('number');
  });
});