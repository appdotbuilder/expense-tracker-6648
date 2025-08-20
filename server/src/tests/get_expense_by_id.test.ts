import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { expensesTable } from '../db/schema';
import { type CreateExpenseInput } from '../schema';
import { getExpenseById } from '../handlers/get_expense_by_id';

// Test expense input
const testExpenseInput: CreateExpenseInput = {
  amount: 25.50,
  date: new Date('2024-01-15'),
  description: 'Test lunch expense',
  category: 'eat',
  payment_method: 'card'
};

describe('getExpenseById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return expense when found', async () => {
    // First create an expense
    const insertResult = await db.insert(expensesTable)
      .values({
        amount: testExpenseInput.amount.toString(), // Convert number to string for numeric column
        date: testExpenseInput.date,
        description: testExpenseInput.description,
        category: testExpenseInput.category,
        payment_method: testExpenseInput.payment_method
      })
      .returning()
      .execute();

    const createdExpense = insertResult[0];

    // Test retrieving the expense
    const result = await getExpenseById(createdExpense.id);

    // Verify the expense was found and has correct data
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdExpense.id);
    expect(result!.amount).toEqual(25.50);
    expect(typeof result!.amount).toEqual('number'); // Verify numeric conversion
    expect(result!.date).toEqual(testExpenseInput.date);
    expect(result!.description).toEqual('Test lunch expense');
    expect(result!.category).toEqual('eat');
    expect(result!.payment_method).toEqual('card');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when expense not found', async () => {
    // Test with non-existent ID
    const result = await getExpenseById(999);

    expect(result).toBeNull();
  });

  it('should handle different expense categories correctly', async () => {
    // Create expenses with different categories
    const categories = ['eat', 'shop', 'subscription', 'others'] as const;
    const createdExpenseIds: number[] = [];

    for (const category of categories) {
      const result = await db.insert(expensesTable)
        .values({
          amount: '15.75',
          date: new Date('2024-01-20'),
          description: `Test ${category} expense`,
          category,
          payment_method: 'cash'
        })
        .returning()
        .execute();
      
      createdExpenseIds.push(result[0].id);
    }

    // Verify each expense can be retrieved with correct category
    for (let i = 0; i < categories.length; i++) {
      const expense = await getExpenseById(createdExpenseIds[i]);
      
      expect(expense).not.toBeNull();
      expect(expense!.category).toEqual(categories[i]);
      expect(expense!.amount).toEqual(15.75);
      expect(typeof expense!.amount).toEqual('number');
    }
  });

  it('should handle different payment methods correctly', async () => {
    // Create expenses with different payment methods
    const paymentMethods = ['cash', 'card', 'bank_transfer', 'digital_wallet', 'check', 'others'] as const;
    const createdExpenseIds: number[] = [];

    for (const paymentMethod of paymentMethods) {
      const result = await db.insert(expensesTable)
        .values({
          amount: '30.00',
          date: new Date('2024-01-25'),
          description: `Test ${paymentMethod} expense`,
          category: 'shop',
          payment_method: paymentMethod
        })
        .returning()
        .execute();
      
      createdExpenseIds.push(result[0].id);
    }

    // Verify each expense can be retrieved with correct payment method
    for (let i = 0; i < paymentMethods.length; i++) {
      const expense = await getExpenseById(createdExpenseIds[i]);
      
      expect(expense).not.toBeNull();
      expect(expense!.payment_method).toEqual(paymentMethods[i]);
      expect(expense!.amount).toEqual(30.00);
      expect(typeof expense!.amount).toEqual('number');
    }
  });

  it('should handle large monetary amounts correctly', async () => {
    // Test with large amount
    const largeAmount = 9999.99;
    
    const insertResult = await db.insert(expensesTable)
      .values({
        amount: largeAmount.toString(),
        date: new Date('2024-02-01'),
        description: 'Large expense test',
        category: 'others',
        payment_method: 'bank_transfer'
      })
      .returning()
      .execute();

    const expense = await getExpenseById(insertResult[0].id);

    expect(expense).not.toBeNull();
    expect(expense!.amount).toEqual(9999.99);
    expect(typeof expense!.amount).toEqual('number');
  });

  it('should preserve exact decimal precision', async () => {
    // Test with various decimal amounts
    const testAmounts = [0.01, 12.34, 567.89, 999.99];
    const createdExpenseIds: number[] = [];

    for (const amount of testAmounts) {
      const result = await db.insert(expensesTable)
        .values({
          amount: amount.toString(),
          date: new Date('2024-02-05'),
          description: `Decimal test ${amount}`,
          category: 'eat',
          payment_method: 'card'
        })
        .returning()
        .execute();
      
      createdExpenseIds.push(result[0].id);
    }

    // Verify each amount is preserved exactly
    for (let i = 0; i < testAmounts.length; i++) {
      const expense = await getExpenseById(createdExpenseIds[i]);
      
      expect(expense).not.toBeNull();
      expect(expense!.amount).toEqual(testAmounts[i]);
      expect(typeof expense!.amount).toEqual('number');
    }
  });
});