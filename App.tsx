import React, { useState, useCallback, useEffect } from 'react';
import { Expense, Status } from './types';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import CameraView from './components/CameraView';
import { SparklesIcon, PencilIcon } from './components/icons';

const ReceiptModal: React.FC<{ imageUrl: string; onClose: () => void; }> = ({ imageUrl, onClose }) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative bg-white p-4 rounded-lg shadow-2xl max-w-3xl max-h-[90vh] w-full mx-4" onClick={e => e.stopPropagation()}>
        <img src={`http://127.0.0.1:5001${imageUrl}`} alt="Receipt" className="w-full h-full object-contain max-h-[calc(90vh-60px)]" />
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-8 h-8 bg-slate-700 text-white rounded-full flex items-center justify-center hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Close receipt view"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expenseData, setExpenseData] = useState<Expense | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [receiptImage, setReceiptImage] = useState<string>('');
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);

  // Load expenses from the backend when the app starts
  const fetchExpenses = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`/api/expenses`);
      if (!response.ok) {
        throw new Error('Failed to fetch expenses');
      }
      const data = await response.json();
      // Map backend snake_case rows to frontend PascalCase Expense shape
      const mapped: Expense[] = (Array.isArray(data) ? data : []).map((row: any) => ({
        id: typeof row.id === 'number' ? row.id : Number(row.id) || 0,
        paidBy: row.paid_by ?? '',
        Date: row.date ?? '',
        Expense_Name: row.expense_name ?? '',
        Amount: typeof row.amount === 'number' ? row.amount : Number(row.amount) || 0,
        Currency: row.currency ?? 'USD',
        Category: typeof row.category === 'string' ? row.category : '',
        locations: Array.isArray(row.locations) ? row.locations.map((x: any) => String(x)) : [],
        Status: row.status ?? Status.Submitted,
        Receipt_URL: row.receipt_url ?? '',
        Notes: row.notes ?? '',
      }));
      setExpenses(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load expenses.');
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    setExpenseData(null);
    setError(null);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setReceiptImage('');
    }
  };

  const handleClearAll = async () => {
    const confirmed = window.confirm('This will permanently delete all expense history. Continue?');
    if (!confirmed) return;
    try {
      setError(null);
      const response = await fetch(`/api/expenses/all`, { method: 'DELETE' });
      if (!response.ok && response.status !== 204) {
        let errText = 'Failed to clear expenses';
        try {
          const errData = await response.json();
          errText = errData?.error || errText;
        } catch (_) {}
        throw new Error(errText);
      }
      await fetchExpenses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not clear expenses.');
    }
  };

  const handleExtract = useCallback(async () => {
    if (!selectedFile) {
      setError("Please select a receipt file first.");
      return;
    }
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('receipt', selectedFile);

    try {
      const response = await fetch(`/api/extract-details`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Extraction failed');
      }
      const extractedData = await response.json();

      setExpenseData({
        id: 0,
        paidBy: '',
        Date: extractedData.Date || new Date().toISOString().slice(0, 10),
        Expense_Name: extractedData.Expense_Name || '',
        Amount: extractedData.Amount || 0,
        Currency: extractedData.Currency || 'THB',
        Category: typeof extractedData.Category === 'string' ? extractedData.Category : '',
        locations: [],
        Status: Status.Submitted,
        Receipt_URL: '',
        Notes: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred during extraction.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile]);

  const handleExpenseChange = (field: keyof Expense, value: any) => {
    if (expenseData) {
      setExpenseData({ ...expenseData, [field]: value });
    }
  };
  
  const handleManualCreate = () => {
    setExpenseData({
      id: 0,
      paidBy: '',
      Date: new Date().toISOString().slice(0, 10),
      Expense_Name: '',
      Amount: 0,
      Currency: 'THB',
      Category: '',
      locations: [],
      Status: Status.Submitted,
      Receipt_URL: '',
      Notes: '',
    });
    setSelectedFile(null);
    setError(null);
    setReceiptImage('');
  };
  
  const handleSubmit = async () => {
    if (!expenseData) return;
    setIsLoading(true);
    setError(null);

    let uploadedReceiptUrl = '';

    // Step 1: Upload the image if a file is selected
    if (selectedFile) {
      const formData = new FormData();
      formData.append('receipt', selectedFile);
      try {
        const response = await fetch(`/api/upload`, {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) throw new Error('File upload failed');
        const result = await response.json();
        uploadedReceiptUrl = result.filePath;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
        setIsLoading(false);
        return;
      }
    }

    // Step 2: Prepare the final expense data
    const finalExpense = { ...expenseData, Receipt_URL: uploadedReceiptUrl };

    // Step 3: Post the expense data to the backend
    try {
      const payload = {
        Date: finalExpense.Date,
        Expense_Name: finalExpense.Expense_Name,
        Amount: finalExpense.Amount,
        Currency: finalExpense.Currency,
        paid_by: finalExpense.paidBy,
        Category: finalExpense.Category,
        locations: Array.isArray(finalExpense.locations) ? finalExpense.locations : [],
        Status: finalExpense.Status,
        Receipt_URL: finalExpense.Receipt_URL,
        Notes: finalExpense.Notes,
      };
      const response = await fetch(`/api/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to save expense');
      // Step 4: Reset the form and refresh the expense list
      handleReset();
      await fetchExpenses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save expense.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setExpenseData(null);
    setError(null);
    setReceiptImage('');
  }

  const handleDeleteExpense = async (id: number) => {
    try {
      setError(null);
      const response = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (!response.ok && response.status !== 204) {
        // If backend returns 404/500 with JSON
        let errText = 'Failed to delete expense';
        try {
          const errData = await response.json();
          errText = errData?.error || errText;
        } catch (_) {}
        throw new Error(errText);
      }
      await fetchExpenses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete expense.');
    }
  };
  
  const handleCaptureReceipt = (file: File) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result as string);
        setSelectedFile(file);
      };
      reader.readAsDataURL(file);
    }
    setIsCameraOpen(false);
  };

  return (
    <div className="min-h-screen font-sans text-slate-800">
      <Header />
      <main className="container mx-auto p-4 md:p-8 max-w-3xl space-y-8">
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-slate-200">
          
          {!expenseData ? (
            <>
              <h2 className="text-2xl font-bold text-slate-700 mb-2">Add New Expense</h2>
              <p className="text-slate-500 mb-6">Upload a receipt for AI extraction or enter details manually.</p>
              <FileUpload onFileSelect={handleFileSelect} processing={isLoading} selectedFile={selectedFile} />

              {selectedFile && (
                <div className="mt-6 text-center">
                  <button
                    onClick={handleExtract}
                    disabled={isLoading}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Extracting...' : <><SparklesIcon className="w-5 h-5" /> Extract Details</>}
                  </button>
                </div>
              )}

              {!selectedFile && (
                <>
                    <div className="flex items-center my-6">
                        <div className="flex-grow border-t border-slate-200"></div>
                        <span className="flex-shrink mx-4 text-slate-400 font-medium text-sm">OR</span>
                        <div className="flex-grow border-t border-slate-200"></div>
                    </div>

                    <div className="text-center">
                        <button
                            onClick={handleManualCreate}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-all"
                        >
                            <PencilIcon className="w-5 h-5" /> Create Manually
                        </button>
                    </div>
                </>
              )}
            </>
          ) : (
            <ExpenseForm 
              expense={expenseData}
              onExpenseChange={handleExpenseChange}
              onSubmit={handleSubmit}
              onCancel={handleReset}
              loading={isLoading}
              title={selectedFile ? "Extracted Details" : "Enter Expense Details"}
              receiptImage={receiptImage}
              onAddReceipt={() => setIsCameraOpen(true)}
              onRemoveReceipt={() => { setReceiptImage(''); setSelectedFile(null); }}
            />
          )}

          {isLoading && !expenseData && <p className="text-center text-indigo-600 font-semibold mt-4">Analyzing receipt, please wait...</p>}
          
          {error && <div className="mt-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">{error}</div>}

        </div>

        <ExpenseList expenses={expenses} onDeleteExpense={handleDeleteExpense} onViewReceipt={setViewingReceiptUrl} onClearAll={handleClearAll} />
        
        <footer className="text-center text-sm text-slate-400 !mt-8">
          <p>Internal Expense Tool</p>
        </footer>
      </main>
      {viewingReceiptUrl && (
        <ReceiptModal imageUrl={viewingReceiptUrl} onClose={() => setViewingReceiptUrl(null)} />
      )}
       {isCameraOpen && (
        <CameraView
            onClose={() => setIsCameraOpen(false)}
            onCapture={handleCaptureReceipt}
        />
      )}
    </div>
  );
};

export default App;