import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/utils/trpc';
import type { Expense, ExpenseCategory, PaymentMethod, UpdateExpenseInput } from '../../../server/src/schema';

interface ExpenseListProps {
  expenses: Expense[];
  isLoading: boolean;
  onUpdate: (expense: Expense) => void;
  onDelete: (id: number) => void;
}

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

function ExpenseItem({ expense, onUpdate, onDelete }: { 
  expense: Expense; 
  onUpdate: (expense: Expense) => void;
  onDelete: (id: number) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editData, setEditData] = useState<UpdateExpenseInput>({
    id: expense.id,
    amount: expense.amount,
    date: expense.date,
    description: expense.description,
    category: expense.category,
    payment_method: expense.payment_method
  });

  const categoryOption = categoryOptions.find(c => c.value === expense.category);
  const paymentOption = paymentMethodOptions.find(p => p.value === expense.payment_method);

  const handleUpdate = async () => {
    try {
      const updatedExpense = await trpc.updateExpense.mutate(editData);
      onUpdate(updatedExpense);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update expense:', error);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(expense.id);
    } catch (error) {
      console.error('Failed to delete expense:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-medium text-gray-900">{expense.description}</h3>
              <Badge variant="outline" className="text-xs">
                {categoryOption?.emoji} {categoryOption?.label}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                📅 {expense.date.toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                {paymentOption?.emoji} {paymentOption?.label}
              </span>
            </div>
          </div>
          <div className="text-right ml-4">
            <p className="text-xl font-bold text-red-600">-${expense.amount.toFixed(2)}</p>
            <div className="flex items-center gap-2 mt-2">
              <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    ✏️
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Edit Expense</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Amount</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editData.amount || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setEditData((prev: UpdateExpenseInput) => ({ 
                              ...prev, 
                              amount: parseFloat(e.target.value) || 0 
                            }))
                          }
                          className="pl-8"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={editData.date ? formatDateForInput(editData.date) : ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setEditData((prev: UpdateExpenseInput) => ({ 
                            ...prev, 
                            date: new Date(e.target.value) 
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={editData.category}
                        onValueChange={(value: ExpenseCategory) =>
                          setEditData((prev: UpdateExpenseInput) => ({ 
                            ...prev, 
                            category: value 
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <span className="flex items-center gap-2">
                                <span>{option.emoji}</span>
                                <span>{option.label}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Payment Method</Label>
                      <Select
                        value={editData.payment_method}
                        onValueChange={(value: PaymentMethod) =>
                          setEditData((prev: UpdateExpenseInput) => ({ 
                            ...prev, 
                            payment_method: value 
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethodOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <span className="flex items-center gap-2">
                                <span>{option.emoji}</span>
                                <span>{option.label}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={editData.description || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setEditData((prev: UpdateExpenseInput) => ({ 
                            ...prev, 
                            description: e.target.value 
                          }))
                        }
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleUpdate} className="flex-1">
                        💾 Save Changes
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={isDeleting}>
                    {isDeleting ? '⏳' : '🗑️'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Expense</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this expense? This action cannot be undone.
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <p className="font-medium">{expense.description}</p>
                        <p className="text-sm text-gray-600">Amount: ${expense.amount.toFixed(2)}</p>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ExpenseList({ expenses, isLoading, onUpdate, onDelete }: ExpenseListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-48"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">💸</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses found</h3>
        <p className="text-gray-500">Start by adding your first expense or adjust your filters.</p>
      </div>
    );
  }

  // Sort expenses by date (newest first)
  const sortedExpenses = [...expenses].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-4">
      {sortedExpenses.map((expense: Expense) => (
        <ExpenseItem
          key={expense.id}
          expense={expense}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}