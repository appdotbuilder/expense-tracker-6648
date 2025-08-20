import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { ExpenseForm } from '@/components/ExpenseForm';
import { ExpenseList } from '@/components/ExpenseList';
import { ExpenseFilters } from '@/components/ExpenseFilters';
import { ExpenseReports } from '@/components/ExpenseReports';
import type { Expense, ExpenseFilter, CreateExpenseInput } from '../../server/src/schema';

function App() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('expenses');
  const [filters, setFilters] = useState<ExpenseFilter>({});
  const [totalExpenses, setTotalExpenses] = useState(0);

  // Load expenses with filters
  const loadExpenses = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getExpenses.query(filters);
      setExpenses(result);
      // Calculate total
      const total = result.reduce((sum, expense) => sum + expense.amount, 0);
      setTotalExpenses(total);
    } catch (error) {
      console.error('Failed to load expenses:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const handleCreateExpense = async (data: CreateExpenseInput) => {
    try {
      const newExpense = await trpc.createExpense.mutate(data);
      setExpenses((prev: Expense[]) => [newExpense, ...prev]);
      setTotalExpenses((prev: number) => prev + newExpense.amount);
    } catch (error) {
      console.error('Failed to create expense:', error);
      throw error;
    }
  };

  const handleUpdateExpense = async (updatedExpense: Expense) => {
    setExpenses((prev: Expense[]) => 
      prev.map((expense: Expense) => 
        expense.id === updatedExpense.id ? updatedExpense : expense
      )
    );
    // Recalculate total
    await loadExpenses();
  };

  const handleDeleteExpense = async (id: number) => {
    try {
      await trpc.deleteExpense.mutate(id);
      setExpenses((prev: Expense[]) => prev.filter((expense: Expense) => expense.id !== id));
      // Recalculate total
      const deletedExpense = expenses.find(e => e.id === id);
      if (deletedExpense) {
        setTotalExpenses((prev: number) => prev - deletedExpense.amount);
      }
    } catch (error) {
      console.error('Failed to delete expense:', error);
      throw error;
    }
  };

  const handleFiltersChange = (newFilters: ExpenseFilter) => {
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-2">
            💰 Expense Tracker
          </h1>
          <p className="text-gray-600">Keep track of your spending and make informed financial decisions</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Expenses</p>
                  <p className="text-3xl font-bold">${totalExpenses.toFixed(2)}</p>
                </div>
                <div className="text-4xl opacity-80">📊</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Total Transactions</p>
                  <p className="text-3xl font-bold">{expenses.length}</p>
                </div>
                <div className="text-4xl opacity-80">🧾</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Average Expense</p>
                  <p className="text-3xl font-bold">
                    ${expenses.length > 0 ? (totalExpenses / expenses.length).toFixed(2) : '0.00'}
                  </p>
                </div>
                <div className="text-4xl opacity-80">📈</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white shadow-sm">
            <TabsTrigger value="expenses" className="flex items-center gap-2">
              💸 Expenses
            </TabsTrigger>
            <TabsTrigger value="add" className="flex items-center gap-2">
              ➕ Add New
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              📊 Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="expenses" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    🔍 Filter Expenses
                  </CardTitle>
                  {(filters.category || filters.payment_method || filters.start_date || filters.end_date) && (
                    <Button variant="outline" size="sm" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ExpenseFilters 
                  filters={filters} 
                  onFiltersChange={handleFiltersChange}
                />
                {(filters.category || filters.payment_method || filters.start_date || filters.end_date) && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {filters.category && (
                      <Badge variant="secondary">Category: {filters.category}</Badge>
                    )}
                    {filters.payment_method && (
                      <Badge variant="secondary">Payment: {filters.payment_method}</Badge>
                    )}
                    {filters.start_date && (
                      <Badge variant="secondary">From: {filters.start_date.toLocaleDateString()}</Badge>
                    )}
                    {filters.end_date && (
                      <Badge variant="secondary">To: {filters.end_date.toLocaleDateString()}</Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📋 Your Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ExpenseList 
                  expenses={expenses}
                  isLoading={isLoading}
                  onUpdate={handleUpdateExpense}
                  onDelete={handleDeleteExpense}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  ➕ Add New Expense
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ExpenseForm 
                  onSubmit={handleCreateExpense}
                  onSuccess={() => setActiveTab('expenses')}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <ExpenseReports />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;