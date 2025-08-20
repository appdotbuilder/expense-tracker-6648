import { serial, text, pgTable, timestamp, numeric, pgEnum } from 'drizzle-orm/pg-core';

// Define enums for categories and payment methods
export const expenseCategoryEnum = pgEnum('expense_category', ['eat', 'shop', 'subscription', 'others']);
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'card', 'bank_transfer', 'digital_wallet', 'check', 'others']);

// Expenses table
export const expensesTable = pgTable('expenses', {
  id: serial('id').primaryKey(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(), // Use numeric for monetary values with precision
  date: timestamp('date').notNull(), // Date when the expense occurred
  description: text('description').notNull(),
  category: expenseCategoryEnum('category').notNull(),
  payment_method: paymentMethodEnum('payment_method').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// TypeScript types for the table schema
export type Expense = typeof expensesTable.$inferSelect; // For SELECT operations
export type NewExpense = typeof expensesTable.$inferInsert; // For INSERT operations

// Export all tables and enums for proper query building
export const tables = { 
  expenses: expensesTable 
};

export const enums = {
  expenseCategory: expenseCategoryEnum,
  paymentMethod: paymentMethodEnum
};