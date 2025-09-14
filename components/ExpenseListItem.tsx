import React from 'react';
import { Expense } from '../types';
import { TrashIcon, EyeIcon } from './icons';

interface ExpenseListItemProps {
  expense: Expense;
  onDelete: () => void;
  onViewReceipt: (url: string) => void;
}

// Helper: format currency safely
const formatCurrency = (amount: number, currencyCode: string | null | undefined) => {
  const safeCurrency = currencyCode && currencyCode.length === 3 ? currencyCode : 'USD';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: safeCurrency, minimumFractionDigits: 2 }).format(amount);
  } catch {
    return amount ? amount.toFixed(2) : '0.00';
  }
};

const ExpenseListItem: React.FC<ExpenseListItemProps> = ({ expense, onDelete, onViewReceipt }) => {
  if (!expense) return null;

  return (
    <tr className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50">
      {/* Date */}
      <td className="p-4 text-sm text-slate-700 whitespace-nowrap">{expense.Date}</td>

      {/* Expense (name + single Category tag) */}
      <td className="p-4 text-sm font-medium text-slate-800">
        <div className="flex flex-col gap-1">
          <span>{expense.Expense_Name}</span>
          {expense.Category && (
            <span className="inline-flex w-fit items-center px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {expense.Category}
            </span>
          )}
        </div>
      </td>

      {/* Paid By */}
      <td className="p-4 text-sm text-slate-700 text-center whitespace-nowrap">{expense.paidBy || '-'}</td>

      {/* Amount */}
      <td className="p-4 text-sm text-slate-700 text-right whitespace-nowrap">
        {formatCurrency(expense.Amount, expense.Currency)}
      </td>

      {/* Locations (mapped badges) */}
      <td className="p-4 text-sm text-slate-700 whitespace-nowrap">
        <div className="flex flex-wrap gap-1">
          {(() => {
            const legacy = (expense as any).expense_for as unknown;
            if (typeof legacy === 'string' && legacy.trim().startsWith('[')) {
              try {
                const arr: string[] = JSON.parse(legacy);
                if (Array.isArray(arr) && arr.length > 0) {
                  return arr.map((loc, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {loc}
                    </span>
                  ));
                }
              } catch (_) {
                // fall through to other render paths
              }
            }
            if (Array.isArray(expense.locations) && expense.locations.length > 0) {
              return expense.locations.map((loc) => (
                <span key={loc} className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {loc}
                </span>
              ));
            }
            if (typeof legacy === 'string' && legacy.trim()) {
              return <span className="text-slate-600">{legacy}</span>;
            }
            return <span className="text-slate-400">-</span>;
          })()}
        </div>
      </td>

      {/* Receipt */}
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
          <span className="text-slate-400">-</span>
        )}
      </td>

      {/* Actions */}
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