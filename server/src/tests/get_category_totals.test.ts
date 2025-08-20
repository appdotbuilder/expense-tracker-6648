import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { expensesTable } from '../db/schema';
import { getCategoryTotals } from '../handlers/get_category_totals';

describe('getCategoryTotals', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no expenses exist', async () => {
    const result = await getCategoryTotals();
    
    expect(result).toEqual([]);
  });

  it('should calculate category totals correctly', async () => {
    // Create test expenses
    await db.insert(expensesTable).values([
      {
        amount: '100.50',
        date: new Date('2023-01-15'),
        description: 'Groceries',
        category: 'eat',
        payment_method: 'card'
      },
      {
        amount: '50.25',
        date: new Date('2023-01-20'),
        description: 'Restaurant',
        category: 'eat',
        payment_method: 'cash'
      },
      {
        amount: '200.00',
        date: new Date('2023-01-25'),
        description: 'Clothes',
        category: 'shop',
        payment_method: 'card'
      }
    ]).execute();

    const result = await getCategoryTotals();

    expect(result).toHaveLength(2);
    
    // Should be ordered by total amount descending
    expect(result[0].category).toBe('shop');
    expect(result[0].total_amount).toBe(200.00);
    expect(result[0].count).toBe(1);
    expect(result[0].percentage).toBeCloseTo(57.02, 2); // 200 / 350.75 * 100
    
    expect(result[1].category).toBe('eat');
    expect(result[1].total_amount).toBe(150.75);
    expect(result[1].count).toBe(2);
    expect(result[1].percentage).toBeCloseTo(42.98, 2); // 150.75 / 350.75 * 100
  });

  it('should filter by start date correctly', async () => {
    // Create expenses across different dates
    await db.insert(expensesTable).values([
      {
        amount: '100.00',
        date: new Date('2023-01-10'),
        description: 'Old expense',
        category: 'eat',
        payment_method: 'card'
      },
      {
        amount: '200.00',
        date: new Date('2023-01-20'),
        description: 'New expense',
        category: 'shop',
        payment_method: 'card'
      },
      {
        amount: '50.00',
        date: new Date('2023-01-25'),
        description: 'Another new expense',
        category: 'eat',
        payment_method: 'cash'
      }
    ]).execute();

    const result = await getCategoryTotals(new Date('2023-01-15'));

    expect(result).toHaveLength(2);
    
    // Only expenses from 2023-01-15 onwards should be included
    const shopCategory = result.find(r => r.category === 'shop');
    const eatCategory = result.find(r => r.category === 'eat');
    
    expect(shopCategory?.total_amount).toBe(200.00);
    expect(shopCategory?.count).toBe(1);
    
    expect(eatCategory?.total_amount).toBe(50.00);
    expect(eatCategory?.count).toBe(1);
    
    // Check percentages sum to 100% (250 total)
    expect(shopCategory?.percentage).toBe(80.00); // 200 / 250 * 100
    expect(eatCategory?.percentage).toBe(20.00); // 50 / 250 * 100
  });

  it('should filter by end date correctly', async () => {
    // Create expenses across different dates
    await db.insert(expensesTable).values([
      {
        amount: '100.00',
        date: new Date('2023-01-10'),
        description: 'Early expense',
        category: 'eat',
        payment_method: 'card'
      },
      {
        amount: '200.00',
        date: new Date('2023-01-20'),
        description: 'Middle expense',
        category: 'shop',
        payment_method: 'card'
      },
      {
        amount: '50.00',
        date: new Date('2023-01-30'),
        description: 'Late expense',
        category: 'subscription',
        payment_method: 'bank_transfer'
      }
    ]).execute();

    const result = await getCategoryTotals(undefined, new Date('2023-01-25'));

    expect(result).toHaveLength(2);
    
    // Only expenses up to 2023-01-25 should be included
    const shopCategory = result.find(r => r.category === 'shop');
    const eatCategory = result.find(r => r.category === 'eat');
    
    expect(shopCategory?.total_amount).toBe(200.00);
    expect(eatCategory?.total_amount).toBe(100.00);
    
    // subscription category should not be present
    const subscriptionCategory = result.find(r => r.category === 'subscription');
    expect(subscriptionCategory).toBeUndefined();
  });

  it('should filter by date range correctly', async () => {
    // Create expenses across a wider date range
    await db.insert(expensesTable).values([
      {
        amount: '75.00',
        date: new Date('2023-01-05'),
        description: 'Before range',
        category: 'eat',
        payment_method: 'card'
      },
      {
        amount: '100.00',
        date: new Date('2023-01-15'),
        description: 'In range',
        category: 'eat',
        payment_method: 'card'
      },
      {
        amount: '200.00',
        date: new Date('2023-01-20'),
        description: 'In range',
        category: 'shop',
        payment_method: 'card'
      },
      {
        amount: '125.00',
        date: new Date('2023-02-01'),
        description: 'After range',
        category: 'others',
        payment_method: 'cash'
      }
    ]).execute();

    const result = await getCategoryTotals(
      new Date('2023-01-10'),
      new Date('2023-01-25')
    );

    expect(result).toHaveLength(2);
    
    // Should be ordered by total amount descending
    expect(result[0].category).toBe('shop');
    expect(result[0].total_amount).toBe(200.00);
    expect(result[0].count).toBe(1);
    
    expect(result[1].category).toBe('eat');
    expect(result[1].total_amount).toBe(100.00);
    expect(result[1].count).toBe(1);
    
    // Total should be 300, so percentages should be 66.67% and 33.33%
    expect(result[0].percentage).toBe(66.67);
    expect(result[1].percentage).toBe(33.33);
  });

  it('should handle all expense categories correctly', async () => {
    // Create expenses for all categories
    await db.insert(expensesTable).values([
      {
        amount: '50.00',
        date: new Date('2023-01-15'),
        description: 'Food',
        category: 'eat',
        payment_method: 'card'
      },
      {
        amount: '100.00',
        date: new Date('2023-01-16'),
        description: 'Shopping',
        category: 'shop',
        payment_method: 'card'
      },
      {
        amount: '25.00',
        date: new Date('2023-01-17'),
        description: 'Netflix',
        category: 'subscription',
        payment_method: 'bank_transfer'
      },
      {
        amount: '75.00',
        date: new Date('2023-01-18'),
        description: 'Miscellaneous',
        category: 'others',
        payment_method: 'cash'
      }
    ]).execute();

    const result = await getCategoryTotals();

    expect(result).toHaveLength(4);
    
    // Verify all categories are present and ordered by amount (descending)
    expect(result[0].category).toBe('shop'); // 100.00
    expect(result[1].category).toBe('others'); // 75.00
    expect(result[2].category).toBe('eat'); // 50.00
    expect(result[3].category).toBe('subscription'); // 25.00
    
    // Verify percentages sum to approximately 100%
    const totalPercentage = result.reduce((sum, cat) => sum + cat.percentage, 0);
    expect(totalPercentage).toBeCloseTo(100, 1); // Allow small rounding differences
  });

  it('should handle single category correctly', async () => {
    await db.insert(expensesTable).values([
      {
        amount: '150.00',
        date: new Date('2023-01-15'),
        description: 'Only expense',
        category: 'eat',
        payment_method: 'card'
      }
    ]).execute();

    const result = await getCategoryTotals();

    expect(result).toHaveLength(1);
    expect(result[0].category).toBe('eat');
    expect(result[0].total_amount).toBe(150.00);
    expect(result[0].count).toBe(1);
    expect(result[0].percentage).toBe(100.00);
  });
});