import React from 'react';
import { Expense, Status } from '../types';
import { TrashIcon, EyeIcon } from './icons';

interface ExpenseListItemProps {
  expense: Expense;
  onDelete: () => void; // keep compatible with parent usage
  onViewReceipt: (url: string) => void;
}

const statusColors: Record<Status, string> = {
  [Status.Submitted]: 'bg-blue-100 text-blue-800',
  [Status.Validated]: 'bg-green-100 text-green-800',
  [Status.Reimbursed]: 'bg-slate-100 text-slate-800',
};

// Helper function to safely format currency
const formatCurrency = (amount: number, currencyCode: string | null | undefined) => {
  const safeCurrency = currencyCode && currencyCode.length === 3 ? currencyCode : 'USD';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: safeCurrency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    console.error('Currency formatting failed:', error);
    return amount ? amount.toFixed(2) : '0.00';
  }
};

const ExpenseListItem: React.FC<ExpenseListItemProps> = ({ expense, onDelete, onViewReceipt }) => {
  if (!expense) return null;

  return (
    <tr className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50">
      <td className="p-4 text-sm text-slate-700 whitespace-nowrap">{expense.Date}</td>
      <td className="p-4 text-sm font-medium text-slate-800">{expense.Expense_Name}</td>
      <td className="p-4 text-sm text-slate-700 text-right whitespace-nowrap">
        {formatCurrency(expense.Amount, expense.Currency)}
      </td>
      <td className="p-4 text-sm text-center whitespace-nowrap">
        {expense.Status && (
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[expense.Status]}`}>
            {expense.Status}
          </span>
        )}
      </td>
      <td className="p-4 text-center">
        {expense.Receipt_URL ? (
          <button
            onClick={() => onViewReceipt(expense.Receipt_URL)}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-full transition-colors"
            aria-label={`View receipt for ${expense.Expense_Name}`}
          >
            <EyeIcon className="w-5 h-5" />
          </button>
        ) : (
          <span className="text-sm text-slate-400">-</span>
        )}
      </td>
      <td className="p-4 text-center">
        <button
          onClick={onDelete}
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
          aria-label={`Delete expense ${expense.Expense_Name}`}
        >
          <TrashIcon className="w-5 h-5" />
        </button>
      </td>
    </tr>
  );
};

export default ExpenseListItem;