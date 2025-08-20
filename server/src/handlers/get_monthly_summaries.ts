import { db } from '../db';
import { expensesTable } from '../db/schema';
import { type MonthlySummary, type ExpenseCategory } from '../schema';
import { sql, gte, lte, and, desc } from 'drizzle-orm';

// Type for category breakdown with all properties guaranteed to exist
type CategoryBreakdown = {
  [K in ExpenseCategory]: {
    total_amount: number;
    count: number;
  };
};

export const getMonthlySummaries = async (year?: number, limit: number = 12): Promise<MonthlySummary[]> => {
  try {
    // Use current year if not provided
    const targetYear = year ?? new Date().getFullYear();
    
    // Create date range for the year
    const startDate = new Date(targetYear, 0, 1); // January 1st
    const endDate = new Date(targetYear, 11, 31, 23, 59, 59); // December 31st
    
    // Query to get monthly summaries with category breakdown
    const results = await db
      .select({
        year: sql<number>`EXTRACT(YEAR FROM ${expensesTable.date})::int`,
        month: sql<number>`EXTRACT(MONTH FROM ${expensesTable.date})::int`,
        category: expensesTable.category,
        total_amount: sql<string>`SUM(${expensesTable.amount})`,
        count: sql<number>`COUNT(*)::int`
      })
      .from(expensesTable)
      .where(
        and(
          gte(expensesTable.date, startDate),
          lte(expensesTable.date, endDate)
        )
      )
      .groupBy(
        sql`EXTRACT(YEAR FROM ${expensesTable.date})`,
        sql`EXTRACT(MONTH FROM ${expensesTable.date})`,
        expensesTable.category
      )
      .orderBy(
        desc(sql`EXTRACT(YEAR FROM ${expensesTable.date})`),
        desc(sql`EXTRACT(MONTH FROM ${expensesTable.date})`)
      )
      .execute();

    // Process results into monthly summaries
    const monthlyMap = new Map<string, {
      year: number;
      month: number;
      total_amount: number;
      total_count: number;
      by_category: CategoryBreakdown;
    }>();

    // Initialize empty category objects
    const createEmptyCategoryRecord = (): CategoryBreakdown => ({
      eat: { total_amount: 0, count: 0 },
      shop: { total_amount: 0, count: 0 },
      subscription: { total_amount: 0, count: 0 },
      others: { total_amount: 0, count: 0 }
    });

    // Group results by month and calculate totals
    for (const row of results) {
      const key = `${row.year}-${row.month}`;
      
      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, {
          year: row.year,
          month: row.month,
          total_amount: 0,
          total_count: 0,
          by_category: createEmptyCategoryRecord()
        });
      }

      const monthSummary = monthlyMap.get(key)!;
      const categoryAmount = parseFloat(row.total_amount);
      
      // Add to monthly totals
      monthSummary.total_amount += categoryAmount;
      monthSummary.total_count += row.count;
      
      // Add to category breakdown
      monthSummary.by_category[row.category as ExpenseCategory] = {
        total_amount: categoryAmount,
        count: row.count
      };
    }

    // Convert map to array and sort by year/month (most recent first)
    const monthlySummaries = Array.from(monthlyMap.values())
      .sort((a, b) => {
        if (a.year !== b.year) {
          return b.year - a.year; // Most recent year first
        }
        return b.month - a.month; // Most recent month first
      })
      .slice(0, limit); // Apply limit

    // Ensure type compatibility by casting to MonthlySummary[]
    return monthlySummaries as MonthlySummary[];
  } catch (error) {
    console.error('Monthly summaries retrieval failed:', error);
    throw error;
  }
};