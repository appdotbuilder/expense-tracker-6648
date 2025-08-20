import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ExpenseFilter, ExpenseCategory, PaymentMethod } from '../../../server/src/schema';

interface ExpenseFiltersProps {
  filters: ExpenseFilter;
  onFiltersChange: (filters: ExpenseFilter) => void;
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

export function ExpenseFilters({ filters, onFiltersChange }: ExpenseFiltersProps) {
  const updateFilter = (key: keyof ExpenseFilter, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const formatDateForInput = (date: Date | null) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Category Filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">🏷️ Category</Label>
        <Select
          value={filters.category || 'all'}
          onValueChange={(value) => 
            updateFilter('category', value === 'all' ? undefined : value as ExpenseCategory)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
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

      {/* Payment Method Filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">💳 Payment Method</Label>
        <Select
          value={filters.payment_method || 'all'}
          onValueChange={(value) => 
            updateFilter('payment_method', value === 'all' ? undefined : value as PaymentMethod)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All payment methods" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payment Methods</SelectItem>
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

      {/* Amount Range */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">💰 Amount Range</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">Rp</span>
            <Input
              type="number"
              step="1"
              min="0"
              placeholder="Min"
              value={filters.min_amount || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateFilter('min_amount', e.target.value ? parseFloat(e.target.value) : undefined)
              }
              className="pl-10"
            />
          </div>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">Rp</span>
            <Input
              type="number"
              step="1"
              min="0"
              placeholder="Max"
              value={filters.max_amount || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateFilter('max_amount', e.target.value ? parseFloat(e.target.value) : undefined)
              }
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Date Range - Start Date */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">📅 From Date</Label>
        <Input
          type="date"
          value={formatDateForInput(filters.start_date || null)}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            updateFilter('start_date', e.target.value ? new Date(e.target.value) : undefined)
          }
        />
      </div>

      {/* Date Range - End Date */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">📅 To Date</Label>
        <Input
          type="date"
          value={formatDateForInput(filters.end_date || null)}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            updateFilter('end_date', e.target.value ? new Date(e.target.value) : undefined)
          }
        />
      </div>
    </div>
  );
}