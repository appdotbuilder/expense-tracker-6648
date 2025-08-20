import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import type { CreateExpenseInput, ExpenseCategory, PaymentMethod } from '../../../server/src/schema';

interface ExpenseFormProps {
  onSubmit: (data: CreateExpenseInput) => Promise<void>;
  onSuccess?: () => void;
  initialData?: Partial<CreateExpenseInput>;
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

export function ExpenseForm({ onSubmit, onSuccess, initialData }: ExpenseFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateExpenseInput>({
    amount: initialData?.amount || 0,
    date: initialData?.date || new Date(),
    description: initialData?.description || '',
    category: initialData?.category || 'others',
    payment_method: initialData?.payment_method || 'card'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSubmit(formData);
      // Reset form after successful submission
      setFormData({
        amount: 0,
        date: new Date(),
        description: '',
        category: 'others',
        payment_method: 'card'
      });
      onSuccess?.();
    } catch (error) {
      console.error('Failed to submit expense:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-sm font-medium">
            💰 Amount
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateExpenseInput) => ({ 
                  ...prev, 
                  amount: parseFloat(e.target.value) || 0 
                }))
              }
              className="pl-8"
              placeholder="0.00"
              required
            />
          </div>
        </div>

        {/* Date */}
        <div className="space-y-2">
          <Label htmlFor="date" className="text-sm font-medium">
            📅 Date
          </Label>
          <Input
            id="date"
            type="date"
            value={formatDateForInput(formData.date)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateExpenseInput) => ({ 
                ...prev, 
                date: new Date(e.target.value) 
              }))
            }
            required
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category" className="text-sm font-medium">
            🏷️ Category
          </Label>
          <Select
            value={formData.category}
            onValueChange={(value: ExpenseCategory) =>
              setFormData((prev: CreateExpenseInput) => ({ 
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

        {/* Payment Method */}
        <div className="space-y-2">
          <Label htmlFor="payment_method" className="text-sm font-medium">
            💳 Payment Method
          </Label>
          <Select
            value={formData.payment_method}
            onValueChange={(value: PaymentMethod) =>
              setFormData((prev: CreateExpenseInput) => ({ 
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
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">
          📝 Description
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev: CreateExpenseInput) => ({ 
              ...prev, 
              description: e.target.value 
            }))
          }
          placeholder="What was this expense for?"
          rows={3}
          required
        />
      </div>

      {/* Preview Card */}
      {formData.amount > 0 && formData.description && (
        <Card className="bg-gray-50 border-dashed">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-2">Preview:</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{formData.description}</p>
                <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                  <span>{categoryOptions.find(c => c.value === formData.category)?.emoji} {categoryOptions.find(c => c.value === formData.category)?.label}</span>
                  <span>•</span>
                  <span>{paymentMethodOptions.find(p => p.value === formData.payment_method)?.emoji} {paymentMethodOptions.find(p => p.value === formData.payment_method)?.label}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-red-600">-${formData.amount.toFixed(2)}</p>
                <p className="text-sm text-gray-500">{formData.date.toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Button 
        type="submit" 
        disabled={isLoading || formData.amount <= 0 || !formData.description.trim()}
        className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
        size="lg"
      >
        {isLoading ? '💫 Adding Expense...' : '💰 Add Expense'}
      </Button>
    </form>
  );
}