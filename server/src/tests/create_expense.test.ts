import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { expensesTable } from '../db/schema';
import { type CreateExpenseInput } from '../schema';
import { createExpense } from '../handlers/create_expense';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateExpenseInput = {
  amount: 29.99,
  date: new Date('2024-01-15'),
  description: 'Lunch at restaurant',
  category: 'eat',
  payment_method: 'card'
};

describe('createExpense', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an expense', async () => {
    const result = await createExpense(testInput);

    // Basic field validation
    expect(result.amount).toEqual(29.99);
    expect(typeof result.amount).toBe('number');
    expect(result.date).toBeInstanceOf(Date);
    expect(result.date).toEqual(testInput.date);
    expect(result.description).toEqual('Lunch at restaurant');
    expect(result.category).toEqual('eat');
    expect(result.payment_method).toEqual('card');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save expense to database', async () => {
    const result = await createExpense(testInput);

    // Query database to verify expense was saved
    const expenses = await db.select()
      .from(expensesTable)
      .where(eq(expensesTable.id, result.id))
      .execute();

    expect(expenses).toHaveLength(1);
    const savedExpense = expenses[0];
    
    expect(savedExpense.id).toEqual(result.id);
    expect(parseFloat(savedExpense.amount)).toEqual(29.99);
    expect(savedExpense.date).toBeInstanceOf(Date);
    expect(savedExpense.date).toEqual(testInput.date);
    expect(savedExpense.description).toEqual('Lunch at restaurant');
    expect(savedExpense.category).toEqual('eat');
    expect(savedExpense.payment_method).toEqual('card');
    expect(savedExpense.created_at).toBeInstanceOf(Date);
    expect(savedExpense.updated_at).toBeInstanceOf(Date);
  });

  it('should handle different expense categories', async () => {
    const shopExpense: CreateExpenseInput = {
      amount: 45.50,
      date: new Date('2024-01-16'),
      description: 'Groceries',
      category: 'shop',
      payment_method: 'cash'
    };

    const result = await createExpense(shopExpense);

    expect(result.category).toEqual('shop');
    expect(result.payment_method).toEqual('cash');
    expect(result.amount).toEqual(45.50);
    expect(result.description).toEqual('Groceries');
  });

  it('should handle subscription expenses', async () => {
    const subscriptionExpense: CreateExpenseInput = {
      amount: 15.99,
      date: new Date('2024-01-01'),
      description: 'Netflix subscription',
      category: 'subscription',
      payment_method: 'card'
    };

    const result = await createExpense(subscriptionExpense);

    expect(result.category).toEqual('subscription');
    expect(result.amount).toEqual(15.99);
    expect(result.description).toEqual('Netflix subscription');
  });

  it('should handle different payment methods', async () => {
    const digitalWalletExpense: CreateExpenseInput = {
      amount: 12.50,
      date: new Date('2024-01-17'),
      description: 'Coffee shop',
      category: 'eat',
      payment_method: 'digital_wallet'
    };

    const result = await createExpense(digitalWalletExpense);

    expect(result.payment_method).toEqual('digital_wallet');
    expect(result.amount).toEqual(12.50);
  });

  it('should handle precise decimal amounts', async () => {
    const preciseExpense: CreateExpenseInput = {
      amount: 123.45,
      date: new Date('2024-01-18'),
      description: 'Office supplies',
      category: 'others',
      payment_method: 'bank_transfer'
    };

    const result = await createExpense(preciseExpense);

    expect(result.amount).toEqual(123.45);
    expect(typeof result.amount).toBe('number');
    
    // Verify precision is maintained in database
    const saved = await db.select()
      .from(expensesTable)
      .where(eq(expensesTable.id, result.id))
      .execute();
    
    expect(parseFloat(saved[0].amount)).toEqual(123.45);
  });

  it('should create multiple expenses independently', async () => {
    const expense1 = await createExpense({
      amount: 10.00,
      date: new Date('2024-01-19'),
      description: 'First expense',
      category: 'eat',
      payment_method: 'cash'
    });

    const expense2 = await createExpense({
      amount: 20.00,
      date: new Date('2024-01-20'),
      description: 'Second expense',
      category: 'shop',
      payment_method: 'card'
    });

    expect(expense1.id).not.toEqual(expense2.id);
    expect(expense1.amount).toEqual(10.00);
    expect(expense2.amount).toEqual(20.00);
    expect(expense1.description).toEqual('First expense');
    expect(expense2.description).toEqual('Second expense');

    // Verify both expenses exist in database
    const allExpenses = await db.select()
      .from(expensesTable)
      .execute();

    expect(allExpenses.length).toBeGreaterThanOrEqual(2);
    const expense1Db = allExpenses.find(e => e.id === expense1.id);
    const expense2Db = allExpenses.find(e => e.id === expense2.id);
    
    expect(expense1Db).toBeDefined();
    expect(expense2Db).toBeDefined();
  });
});