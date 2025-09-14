import React, { useState, useEffect, useRef } from 'react';
import { Expense, Category, Status } from '../types';
import { SparklesIcon, PencilIcon, CameraIcon } from './icons';

interface ExpenseFormProps {
  expense: Expense;
  onExpenseChange: (field: keyof Expense, value: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
  loading: boolean;
  title: string;
  receiptImage: string;
  onAddReceipt: () => void;
  onRemoveReceipt: () => void;
}

const InputField: React.FC<{ label: string; id: keyof Expense; type: string; value: string | number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; error?: string; onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void; inputRef?: React.RefObject<HTMLInputElement> }> = ({ label, id, type, value, onChange, error, onBlur, inputRef }) => {
  const baseClasses = "w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 transition";
  const normalClasses = "border-slate-300 focus:ring-indigo-500 focus:border-indigo-500";
  const errorClasses = "border-red-500 focus:ring-red-500 focus:border-red-500";
  
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
      <input
        type={type}
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        ref={inputRef}
        className={`${baseClasses} ${error ? errorClasses : normalClasses}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && <p id={`${id}-error`} className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

const SelectField: React.FC<{ label: string; id: keyof Expense; value: string; children: React.ReactNode; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; error?: string }> = ({ label, id, value, children, onChange, error }) => {
  const baseClasses = "w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 transition bg-white";
  const normalClasses = "border-slate-300 focus:ring-indigo-500 focus:border-indigo-500";
  const errorClasses = "border-red-500 focus:ring-red-500 focus:border-red-500";
  
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
      <select
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        className={`${baseClasses} ${error ? errorClasses : normalClasses}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      >
        {children}
      </select>
      {error && <p id={`${id}-error`} className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

const ExpenseForm: React.FC<ExpenseFormProps> = ({ expense, onExpenseChange, onSubmit, onCancel, loading, title, receiptImage, onAddReceipt, onRemoveReceipt }) => {
  const [errors, setErrors] = useState<Partial<Record<keyof Expense, string>>>({});
  const [recentPayers, setRecentPayers] = useState<string[]>([]);
  const paidByInputRef = useRef<HTMLInputElement>(null);

  // Load recent payers from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('recentPayers');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setRecentPayers(parsed.filter((v) => typeof v === 'string' && v.trim()).slice(0, 10));
        }
      }
    } catch (_) {
      // ignore
    }
  }, []);

  const persistRecentPayers = (list: string[]) => {
    try {
      localStorage.setItem('recentPayers', JSON.stringify(list));
    } catch (_) {
      // ignore
    }
  };

  const addRecentPayer = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setRecentPayers((prev) => {
      const next = [trimmed, ...prev.filter((p) => p.toLowerCase() !== trimmed.toLowerCase())].slice(0, 10);
      persistRecentPayers(next);
      return next;
    });
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const isNumber = name === 'Amount';
    onExpenseChange(name as keyof Expense, isNumber ? parseFloat(value) || 0 : value);
  };

  // Toggle a location label on/off in the array
  const toggleLocation = (label: string) => {
    const current = Array.isArray(expense.locations) ? expense.locations : [];
    const exists = current.includes(label);
    const next = exists ? current.filter((c) => c !== label) : [...current, label];
    onExpenseChange('locations', next);
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof Expense, string>> = {};
    if (!expense.Expense_Name.trim()) newErrors.Expense_Name = "Expense name is required.";
    if (!expense.Date) {
        newErrors.Date = "Date is required.";
    } else if (isNaN(new Date(expense.Date).getTime())) {
        newErrors.Date = "Please enter a valid date.";
    }
    if (expense.Amount <= 0) newErrors.Amount = "Amount must be a positive number.";
    if (!expense.Currency.trim()) newErrors.Currency = "Currency is required.";
    if (!expense.Category || !expense.Category.trim()) newErrors.Category = "Category is required.";
    if (!expense.paidBy.trim()) newErrors.paidBy = "Payer name is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePaidByBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    addRecentPayer(e.target.value);
  };

  const handleRecentPayerSelect: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const val = e.target.value;
    if (val === '__add_new__') {
      onExpenseChange('paidBy', '');
      // reset select to placeholder
      e.target.value = '';
      setTimeout(() => paidByInputRef.current?.focus(), 0);
    } else if (val) {
      onExpenseChange('paidBy', val);
      addRecentPayer(val);
      // reset select to placeholder
      e.target.value = '';
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validate()) {
      onSubmit();
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-2 mb-6">
        {title === "Extracted Details" ? 
            <SparklesIcon className="w-6 h-6 text-indigo-500" /> : 
            <PencilIcon className="w-6 h-6 text-slate-600" />
        }
        <h2 className="text-2xl font-bold text-slate-700">{title}</h2>
      </div>
      <form onSubmit={handleFormSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label="Expense Name" id="Expense_Name" type="text" value={expense.Expense_Name} onChange={handleChange} error={errors.Expense_Name} />
          <InputField label="Date" id="Date" type="date" value={expense.Date} onChange={handleChange} error={errors.Date} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label="Amount" id="Amount" type="number" value={expense.Amount} onChange={handleChange} error={errors.Amount} />
          <InputField label="Currency" id="Currency" type="text" value={expense.Currency} onChange={handleChange} error={errors.Currency} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <InputField label="Category" id="Category" type="text" value={expense.Category} onChange={handleChange} error={errors.Category} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Locations</label>
            <div className="grid grid-cols-2 gap-2">
              {['Red Dragon','Mandarin','Shark BKK','Shark PTY','Fahrenheit','Bliss','Geisha','BB Gun'].map(label => (
                <label key={label} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={Array.isArray(expense.locations) ? expense.locations.includes(label) : false}
                    onChange={() => toggleLocation(label)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <InputField label="Paid By" id="paidBy" type="text" value={expense.paidBy} onChange={handleChange} onBlur={handlePaidByBlur} inputRef={paidByInputRef} error={errors.paidBy} />
            {recentPayers.length > 0 && (
              <div className="mt-2">
                <label className="sr-only" htmlFor="recent-payers">Recent payers</label>
                <select id="recent-payers" defaultValue="" onChange={handleRecentPayerSelect} className="w-full px-3 py-2 border rounded-md shadow-sm bg-white border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm">
                  <option value="" disabled>Choose recent payer…</option>
                  {recentPayers.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                  <option value="__add_new__">+ Add new</option>
                </select>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Receipt</label>
          {receiptImage ? (
              <div className="relative group mt-1">
                  <img src={receiptImage} alt="Receipt preview" className="w-full max-h-60 object-contain rounded-lg border border-slate-200 bg-slate-50" />
                  {title === "Enter Expense Details" && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                          <button
                              type="button"
                              onClick={onRemoveReceipt}
                              className="px-4 py-2 bg-white text-slate-800 font-semibold rounded-lg shadow-md hover:bg-slate-100"
                          >
                              Remove
                          </button>
                      </div>
                  )}
              </div>
          ) : (
              title === "Enter Expense Details" && (
                  <button
                      type="button"
                      onClick={onAddReceipt}
                      className="mt-1 w-full flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-dashed border-slate-300 text-slate-600 rounded-lg hover:border-indigo-400 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all"
                  >
                      <CameraIcon className="w-5 h-5" />
                      <span>Add Photo with Camera</span>
                  </button>
              )
          )}
        </div>

         <div>
          <label htmlFor="Notes" className="block text-sm font-medium text-slate-600 mb-1">Notes</label>
          <textarea
            id="Notes"
            name="Notes"
            rows={3}
            value={expense.Notes}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            placeholder="Add any additional notes here..."
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Expense'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExpenseForm;