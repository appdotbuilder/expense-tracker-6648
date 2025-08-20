import { z } from 'zod';

// Expense category enum
export const expenseCategorySchema = z.enum(['eat', 'shop', 'subscription', 'others']);
export type ExpenseCategory = z.infer<typeof expenseCategorySchema>;

// Payment method enum
export const paymentMethodSchema = z.enum(['cash', 'card', 'bank_transfer', 'digital_wallet', 'check', 'others']);
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

// Expense schema
export const expenseSchema = z.object({
  id: z.number(),
  amount: z.number().positive(), // Using number for proper handling of numeric values
  date: z.coerce.date(), // Automatically converts string to Date
  description: z.string(),
  category: expenseCategorySchema,
  payment_method: paymentMethodSchema,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Expense = z.infer<typeof expenseSchema>;

// Input schema for creating expenses
export const createExpenseInputSchema = z.object({
  amount: z.number().positive(), // Must be positive
  date: z.coerce.date(), // Accept string or Date, convert to Date
  description: z.string().min(1), // Non-empty description
  category: expenseCategorySchema,
  payment_method: paymentMethodSchema
});

export type CreateExpenseInput = z.infer<typeof createExpenseInputSchema>;

// Input schema for updating expenses
export const updateExpenseInputSchema = z.object({
  id: z.number(),
  amount: z.number().positive().optional(),
  date: z.coerce.date().optional(),
  description: z.string().min(1).optional(),
  category: expenseCategorySchema.optional(),
  payment_method: paymentMethodSchema.optional()
});

export type UpdateExpenseInput = z.infer<typeof updateExpenseInputSchema>;

// Schema for expense filters/queries
export const expenseFilterSchema = z.object({
  category: expenseCategorySchema.optional(),
  payment_method: paymentMethodSchema.optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  min_amount: z.number().positive().optional(),
  max_amount: z.number().positive().optional()
});

export type ExpenseFilter = z.infer<typeof expenseFilterSchema>;

// Schema for expense summary/report
export const expenseSummarySchema = z.object({
  total_amount: z.number(),
  total_count: z.number().int(),
  average_amount: z.number(),
  by_category: z.record(expenseCategorySchema, z.object({
    total_amount: z.number(),
    count: z.number().int()
  })),
  by_payment_method: z.record(paymentMethodSchema, z.object({
    total_amount: z.number(),
    count: z.number().int()
  })),
  period: z.object({
    start_date: z.coerce.date(),
    end_date: z.coerce.date()
  })
});

export type ExpenseSummary = z.infer<typeof expenseSummarySchema>;

// Schema for monthly summary
export const monthlySummarySchema = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  total_amount: z.number(),
  total_count: z.number().int(),
  by_category: z.record(expenseCategorySchema, z.object({
    total_amount: z.number(),
    count: z.number().int()
  }))
});

export type MonthlySummary = z.infer<typeof monthlySummarySchema>;

// Input schema for getting summaries
export const summaryInputSchema = z.object({
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  category: expenseCategorySchema.optional(),
  payment_method: paymentMethodSchema.optional()
});

export type SummaryInput = z.infer<typeof summaryInputSchema>;