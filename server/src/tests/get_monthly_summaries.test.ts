import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { expensesTable } from '../db/schema';
import { type CreateExpenseInput } from '../schema';
import { getMonthlySummaries } from '../handlers/get_monthly_summaries';

// Test data for different months and categories
const testExpenses: CreateExpenseInput[] = [
  // January 2024 expenses
  {
    amount: 25.99,
    date: new Date('2024-01-15'),
    description: 'Lunch at restaurant',
    category: 'eat',
    payment_method: 'card'
  },
  {
    amount: 120.50,
    date: new Date('2024-01-20'),
    description: 'Grocery shopping',
    category: 'shop',
    payment_method: 'card'
  },
  {
    amount: 9.99,
    date: new Date('2024-01-05'),
    description: 'Netflix subscription',
    category: 'subscription',
    payment_method: 'card'
  },
  
  // February 2024 expenses
  {
    amount: 45.75,
    date: new Date('2024-02-10'),
    description: 'Dinner out',
    category: 'eat',
    payment_method: 'cash'
  },
  {
    amount: 15.00,
    date: new Date('2024-02-14'),
    description: 'Coffee',
    category: 'eat',
    payment_method: 'card'
  },
  {
    amount: 200.00,
    date: new Date('2024-02-25'),
    description: 'Clothing purchase',
    category: 'shop',
    payment_method: 'card'
  },
  
  // March 2024 expenses
  {
    amount: 30.25,
    date: new Date('2024-03-08'),
    description: 'Fast food',
    category: 'eat',
    payment_method: 'card'
  },
  {
    amount: 50.00,
    date: new Date('2024-03-12'),
    description: 'Gas bill',
    category: 'others',
    payment_method: 'bank_transfer'
  },
  
  // 2023 expenses (for year filtering test)
  {
    amount: 75.00,
    date: new Date('2023-12-15'),
    description: 'Year-end shopping',
    category: 'shop',
    payment_method: 'card'
  }
];

describe('getMonthlySummaries', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test expenses
  const createTestExpenses = async () => {
    for (const expense of testExpenses) {
      await db.insert(expensesTable)
        .values({
          amount: expense.amount.toString(),
          date: expense.date,
          description: expense.description,
          category: expense.category,
          payment_method: expense.payment_method
        })
        .execute();
    }
  };

  it('should return monthly summaries for specified year', async () => {
    await createTestExpenses();

    const summaries = await getMonthlySummaries(2024);

    expect(summaries).toHaveLength(3); // January, February, March 2024
    
    // Check that all summaries are for 2024
    summaries.forEach(summary => {
      expect(summary.year).toBe(2024);
    });

    // Verify summaries are ordered by month (most recent first)
    expect(summaries[0].month).toBe(3); // March
    expect(summaries[1].month).toBe(2); // February  
    expect(summaries[2].month).toBe(1); // January
  });

  it('should calculate correct totals for each month', async () => {
    await createTestExpenses();

    const summaries = await getMonthlySummaries(2024);

    // March 2024: 30.25 + 50.00 = 80.25, 2 expenses
    const marchSummary = summaries.find(s => s.month === 3);
    expect(marchSummary).toBeDefined();
    expect(marchSummary!.total_amount).toBe(80.25);
    expect(marchSummary!.total_count).toBe(2);

    // February 2024: 45.75 + 15.00 + 200.00 = 260.75, 3 expenses
    const febSummary = summaries.find(s => s.month === 2);
    expect(febSummary).toBeDefined();
    expect(febSummary!.total_amount).toBe(260.75);
    expect(febSummary!.total_count).toBe(3);

    // January 2024: 25.99 + 120.50 + 9.99 = 156.48, 3 expenses
    const janSummary = summaries.find(s => s.month === 1);
    expect(janSummary).toBeDefined();
    expect(janSummary!.total_amount).toBeCloseTo(156.48, 2);
    expect(janSummary!.total_count).toBe(3);
  });

  it('should provide correct category breakdowns', async () => {
    await createTestExpenses();

    const summaries = await getMonthlySummaries(2024);

    // Check February category breakdown
    const febSummary = summaries.find(s => s.month === 2)!;
    expect(febSummary).toBeDefined();
    expect(febSummary.by_category.eat!.total_amount).toBe(60.75); // 45.75 + 15.00
    expect(febSummary.by_category.eat!.count).toBe(2);
    expect(febSummary.by_category.shop!.total_amount).toBe(200.00);
    expect(febSummary.by_category.shop!.count).toBe(1);
    expect(febSummary.by_category.subscription!.total_amount).toBe(0);
    expect(febSummary.by_category.subscription!.count).toBe(0);
    expect(febSummary.by_category.others!.total_amount).toBe(0);
    expect(febSummary.by_category.others!.count).toBe(0);

    // Check January category breakdown
    const janSummary = summaries.find(s => s.month === 1)!;
    expect(janSummary).toBeDefined();
    expect(janSummary.by_category.eat!.total_amount).toBe(25.99);
    expect(janSummary.by_category.eat!.count).toBe(1);
    expect(janSummary.by_category.shop!.total_amount).toBe(120.50);
    expect(janSummary.by_category.shop!.count).toBe(1);
    expect(janSummary.by_category.subscription!.total_amount).toBe(9.99);
    expect(janSummary.by_category.subscription!.count).toBe(1);
  });

  it('should use current year when no year is specified', async () => {
    await createTestExpenses();

    const currentYear = new Date().getFullYear();
    const summaries = await getMonthlySummaries();

    // All summaries should be for current year
    summaries.forEach(summary => {
      expect(summary.year).toBe(currentYear);
    });
  });

  it('should respect the limit parameter', async () => {
    await createTestExpenses();

    const summaries = await getMonthlySummaries(2024, 2);

    expect(summaries).toHaveLength(2);
    // Should return March and February (most recent first)
    expect(summaries[0].month).toBe(3);
    expect(summaries[1].month).toBe(2);
  });

  it('should use default limit of 12 when not specified', async () => {
    await createTestExpenses();

    const summaries = await getMonthlySummaries(2024);

    // Should not exceed 12 months and should include all available months
    expect(summaries.length).toBeLessThanOrEqual(12);
    expect(summaries).toHaveLength(3); // We only have 3 months of data
  });

  it('should return empty array for year with no expenses', async () => {
    await createTestExpenses();

    const summaries = await getMonthlySummaries(2022);

    expect(summaries).toHaveLength(0);
  });

  it('should handle single expense correctly', async () => {
    // Create only one expense
    await db.insert(expensesTable)
      .values({
        amount: '99.99',
        date: new Date('2024-05-15'),
        description: 'Single expense',
        category: 'eat',
        payment_method: 'card'
      })
      .execute();

    const summaries = await getMonthlySummaries(2024);

    expect(summaries).toHaveLength(1);
    const summary = summaries[0]!;
    expect(summary.year).toBe(2024);
    expect(summary.month).toBe(5);
    expect(summary.total_amount).toBe(99.99);
    expect(summary.total_count).toBe(1);
    expect(summary.by_category.eat!.total_amount).toBe(99.99);
    expect(summary.by_category.eat!.count).toBe(1);
  });

  it('should handle multiple categories in same month', async () => {
    // Create expenses with all categories in one month
    const multiCategoryExpenses = [
      { amount: '10.00', category: 'eat' as const },
      { amount: '20.00', category: 'shop' as const },
      { amount: '30.00', category: 'subscription' as const },
      { amount: '40.00', category: 'others' as const }
    ];

    for (const expense of multiCategoryExpenses) {
      await db.insert(expensesTable)
        .values({
          amount: expense.amount,
          date: new Date('2024-06-15'),
          description: `${expense.category} expense`,
          category: expense.category,
          payment_method: 'card'
        })
        .execute();
    }

    const summaries = await getMonthlySummaries(2024);

    expect(summaries).toHaveLength(1);
    const summary = summaries[0]!;
    
    expect(summary.total_amount).toBe(100.00); // 10+20+30+40
    expect(summary.total_count).toBe(4);
    
    expect(summary.by_category.eat!.total_amount).toBe(10.00);
    expect(summary.by_category.shop!.total_amount).toBe(20.00);
    expect(summary.by_category.subscription!.total_amount).toBe(30.00);
    expect(summary.by_category.others!.total_amount).toBe(40.00);
    
    // All categories should have count of 1
    Object.values(summary.by_category).forEach(cat => {
      expect(cat.count).toBe(1);
    });
  });
});