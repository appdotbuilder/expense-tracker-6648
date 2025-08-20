import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { ExpenseSummary, MonthlySummary, ExpenseCategory, PaymentMethod } from '../../../server/src/schema';
import type { CategoryTotal } from '../../../server/src/handlers/get_category_totals';

// Currency formatting utility for Indonesian Rupiah
const formatIDR = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const categoryOptions: { value: ExpenseCategory; label: string; emoji: string }[] = [
  { value: 'eat', label: 'Food & Dining', emoji: '🍽️' },
  { value: 'shop', label: 'Shopping', emoji: '🛍️' },
  { value: 'subscription', label: 'Subscriptions', emoji: '📱' },
  { value: 'others', label: 'Others', emoji: '📦' }
];

const paymentMethodOptions: { value: PaymentMethod; label: string; emoji: string }[] = [
  { value: 'cash', label: 'Cash', emoji: '💵' },
  { value: 'card', label: 'Credit/Debit Card', emoji: '💳' },
  { value: 'bank_transfer', label: 'Bank Transfer', emoji: '🏦' },
  { value: 'digital_wallet', label: 'Digital Wallet', emoji: '📱' },
  { value: 'check', label: 'Check', emoji: '📝' },
  { value: 'others', label: 'Others', emoji: '💰' }
];

export function ExpenseReports() {
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [monthlySummaries, setMonthlySummaries] = useState<MonthlySummary[]>([]);
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start_date: '',
    end_date: ''
  });

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load expense summary
      const summaryInput = {
        start_date: dateRange.start_date ? new Date(dateRange.start_date) : undefined,
        end_date: dateRange.end_date ? new Date(dateRange.end_date) : undefined
      };
      
      const [summaryData, monthlyData, categoryData] = await Promise.all([
        trpc.getExpenseSummary.query(summaryInput),
        trpc.getMonthlySummaries.query({ limit: 6 }),
        trpc.getCategoryTotals.query({
          startDate: summaryInput.start_date,
          endDate: summaryInput.end_date
        })
      ]);

      setSummary(summaryData);
      setMonthlySummaries(monthlyData);
      setCategoryTotals(categoryData);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const clearDateRange = () => {
    setDateRange({ start_date: '', end_date: '' });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-48"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="space-y-2 flex-1">
              <Label>From Date</Label>
              <Input
                type="date"
                value={dateRange.start_date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDateRange(prev => ({ ...prev, start_date: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2 flex-1">
              <Label>To Date</Label>
              <Input
                type="date"
                value={dateRange.end_date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDateRange(prev => ({ ...prev, end_date: e.target.value }))
                }
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={loadReports}>
                🔄 Update
              </Button>
              {(dateRange.start_date || dateRange.end_date) && (
                <Button variant="outline" onClick={clearDateRange}>
                  Clear
                </Button>
              )}
            </div>
          </div>
          {(dateRange.start_date || dateRange.end_date) && (
            <div className="flex gap-2 mt-3">
              {dateRange.start_date && (
                <Badge variant="secondary">
                  From: {new Date(dateRange.start_date).toLocaleDateString()}
                </Badge>
              )}
              {dateRange.end_date && (
                <Badge variant="secondary">
                  To: {new Date(dateRange.end_date).toLocaleDateString()}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Overview */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📈 Expense Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Total Amount</p>
                <p className="text-2xl font-bold text-blue-700">{formatIDR(summary.total_amount)}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Total Transactions</p>
                <p className="text-2xl font-bold text-green-700">{summary.total_count}</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-600 font-medium">Average Amount</p>
                <p className="text-2xl font-bold text-purple-700">{formatIDR(summary.average_amount)}</p>
              </div>
            </div>
            
            <div className="text-sm text-gray-600 text-center">
              📅 Period: {summary.period.start_date.toLocaleDateString()} - {summary.period.end_date.toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Breakdown */}
      {summary && Object.keys(summary.by_category).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🏷️ Spending by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(summary.by_category).map(([category, data]) => {
                const categoryOption = categoryOptions.find(c => c.value === category);
                const percentage = (data.total_amount / summary.total_amount) * 100;
                
                return (
                  <div key={category} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span>{categoryOption?.emoji}</span>
                        <span className="font-medium">{categoryOption?.label || category}</span>
                        <Badge variant="secondary" className="text-xs">
                          {data.count} transactions
                        </Badge>
                      </div>
                      <div className="text-right">
                        <span className="font-bold">{formatIDR(data.total_amount)}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Totals (Alternative View) */}
      {categoryTotals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📊 Category Totals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryTotals.map((categoryData) => {
                const categoryOption = categoryOptions.find(c => c.value === categoryData.category);
                
                return (
                  <div key={categoryData.category} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span>{categoryOption?.emoji}</span>
                        <span className="font-medium">{categoryOption?.label || categoryData.category}</span>
                        <Badge variant="secondary" className="text-xs">
                          {categoryData.count} transactions
                        </Badge>
                      </div>
                      <div className="text-right">
                        <span className="font-bold">{formatIDR(categoryData.total_amount)}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          ({categoryData.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    <Progress value={categoryData.percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Method Breakdown */}
      {summary && Object.keys(summary.by_payment_method).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💳 Spending by Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(summary.by_payment_method).map(([paymentMethod, data]) => {
                const paymentOption = paymentMethodOptions.find(p => p.value === paymentMethod);
                const percentage = (data.total_amount / summary.total_amount) * 100;
                
                return (
                  <div key={paymentMethod} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span>{paymentOption?.emoji}</span>
                        <span className="font-medium">{paymentOption?.label || paymentMethod}</span>
                        <Badge variant="secondary" className="text-xs">
                          {data.count} transactions
                        </Badge>
                      </div>
                      <div className="text-right">
                        <span className="font-bold">{formatIDR(data.total_amount)}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Summaries */}
      {monthlySummaries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📊 Monthly Trends (Last 6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlySummaries.map((monthly) => (
                <div key={`${monthly.year}-${monthly.month}`} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">
                      {new Date(monthly.year, monthly.month - 1).toLocaleDateString('en-US', { 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </h4>
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatIDR(monthly.total_amount)}</p>
                      <p className="text-sm text-gray-600">{monthly.total_count} transactions</p>
                    </div>
                  </div>
                  
                  {Object.keys(monthly.by_category).length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                      {Object.entries(monthly.by_category).map(([category, data]) => {
                        const categoryOption = categoryOptions.find(c => c.value === category);
                        return (
                          <div key={category} className="text-center p-2 bg-white rounded">
                            <div className="text-lg">{categoryOption?.emoji}</div>
                            <div className="text-xs text-gray-600">{formatIDR(data.total_amount)}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Data State */}
      {!summary && !isLoading && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No expense data available</h3>
            <p className="text-gray-500">Add some expenses to see detailed reports and analytics.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}