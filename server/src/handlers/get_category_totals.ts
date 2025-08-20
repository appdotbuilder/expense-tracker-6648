import { db } from '../db';
import { expensesTable } from '../db/schema';
import { type ExpenseCategory } from '../schema';
import { gte, lte, and, SQL } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export interface CategoryTotal {
    category: ExpenseCategory;
    total_amount: number;
    count: number;
    percentage: number;
}

export const getCategoryTotals = async (startDate?: Date, endDate?: Date): Promise<CategoryTotal[]> => {
    try {
        // Build conditions array for date filtering
        const conditions: SQL<unknown>[] = [];
        
        if (startDate) {
            conditions.push(gte(expensesTable.date, startDate));
        }
        
        if (endDate) {
            conditions.push(lte(expensesTable.date, endDate));
        }

        // Build category totals query
        const categoryQueryBuilder = db.select({
            category: expensesTable.category,
            total_amount: sql<string>`sum(${expensesTable.amount})`.as('total_amount'),
            count: sql<string>`count(*)`.as('count')
        })
        .from(expensesTable);

        // Apply filters and grouping
        const categoryQuery = conditions.length > 0 
            ? categoryQueryBuilder.where(and(...conditions)).groupBy(expensesTable.category)
            : categoryQueryBuilder.groupBy(expensesTable.category);

        const categoryResults = await categoryQuery.execute();

        // Build grand total query
        const grandTotalQueryBuilder = db.select({
            total: sql<string>`sum(${expensesTable.amount})`.as('total')
        })
        .from(expensesTable);

        // Apply same filters for grand total
        const grandTotalQuery = conditions.length > 0 
            ? grandTotalQueryBuilder.where(and(...conditions))
            : grandTotalQueryBuilder;

        const grandTotalResult = await grandTotalQuery.execute();
        const grandTotal = parseFloat(grandTotalResult[0]?.total || '0');

        // Convert results and calculate percentages
        const categoryTotals: CategoryTotal[] = categoryResults.map(result => {
            const totalAmount = parseFloat(result.total_amount);
            const count = parseInt(result.count, 10);
            const percentage = grandTotal > 0 ? (totalAmount / grandTotal) * 100 : 0;

            return {
                category: result.category as ExpenseCategory,
                total_amount: totalAmount,
                count: count,
                percentage: Math.round(percentage * 100) / 100 // Round to 2 decimal places
            };
        });

        // Sort by total amount descending for better insights
        categoryTotals.sort((a, b) => b.total_amount - a.total_amount);

        return categoryTotals;
    } catch (error) {
        console.error('Get category totals failed:', error);
        throw error;
    }
};