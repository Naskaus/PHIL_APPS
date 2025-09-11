import React from 'react';
import { Expense } from '../types';
import ExpenseListItem from './ExpenseListItem';
import { DownloadIcon } from './icons';

// Make TypeScript aware of the jsPDF global variable from the script tag
declare const jspdf: any;

interface ExpenseListProps {
  expenses: Expense[];
  onDeleteExpense: (index: number) => void;
  onViewReceipt: (url: string) => void;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onDeleteExpense, onViewReceipt }) => {
  const isValidCurrency = (c?: string): c is string => !!c && /^[A-Za-z]{3}$/.test(c);
  const formatCurrency = (amount: number, currency?: string): string => {
    const cur = isValidCurrency(currency) ? currency : 'THB';
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: cur, minimumFractionDigits: 2 }).format(amount);
    } catch {
      // Fallback: plain number with optional currency suffix
      const num = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
      return isValidCurrency(currency) ? `${num} ${currency}` : num;
    }
  };

  const totalsByCurrency = expenses.reduce((acc, expense) => {
    const currencyKey = isValidCurrency(expense.Currency) ? expense.Currency : 'THB';
    if (!acc[currencyKey]) {
      acc[currencyKey] = 0;
    }
    acc[currencyKey] += expense.Amount;
    return acc;
  }, {} as Record<string, number>);

  const handleExportPDF = () => {
    if (expenses.length === 0) return;

    const { jsPDF } = jspdf;
    const doc = new jsPDF();

    // Define table columns
    const head = [['Date', 'Expense', 'Amount', 'Status']];

    // Map expense data to table rows
    const body = expenses.map(expense => [
      expense.Date,
      expense.Expense_Name,
      formatCurrency(expense.Amount, expense.Currency),
      expense.Status
    ]);
    
    // Map totals to the footer section of the table
    const foot = (Object.entries(totalsByCurrency) as Array<[string, number]>).map(([currency, total]) => {
      return [
          { content: `Total (${currency})`, colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } },
          { content: formatCurrency(Number(total), currency), styles: { halign: 'right', fontStyle: 'bold' } },
          '' // Empty cell for status column
      ];
    });


    doc.autoTable({
      head: head,
      body: body,
      foot: foot,
      startY: 32,
      theme: 'grid',
      headStyles: { fillColor: [75, 85, 99] }, // slate-600
      footStyles: { fillColor: [241, 245, 249], textColor: [40,40,40] }, // slate-100
      didDrawPage: (data: any) => {
        // PDF Header
        doc.setFontSize(20);
        doc.setTextColor(40);
        doc.text("Expense History Report", data.settings.margin.left, 22);
      },
    });

    // --- Add Receipt Thumbnails ---
    const finalY = (doc as any).lastAutoTable.finalY || 32;
    const expensesWithReceipts = expenses.filter(e => e.Receipt_URL);

    if (expensesWithReceipts.length > 0) {
      const getImageFormat = (dataUrl: string): string => {
        const match = dataUrl.match(/^data:image\/(\w+);base64,/);
        return match ? match[1].toUpperCase() : 'JPEG';
      };

      let currentY = finalY + 15;
      const margin = 14;
      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();

      if (currentY > pageHeight - 40) {
        doc.addPage();
        currentY = margin;
      }
      
      doc.setFontSize(16);
      doc.text("Receipts", margin, currentY);
      currentY += 8;

      const imageWidth = 45;
      const imageHeight = 60;
      const imagePadding = 5;
      let currentX = margin;

      expensesWithReceipts.forEach((expense) => {
        if (currentX + imageWidth > pageWidth - margin) {
          currentX = margin;
          currentY += imageHeight + imagePadding + 10;
        }
        
        if (currentY + imageHeight + 10 > pageHeight - margin) {
            doc.addPage();
            currentY = margin;
            currentX = margin;
            doc.setFontSize(16);
            doc.text("Receipts (continued)", margin, currentY);
            currentY += 8;
        }

        try {
          const format = getImageFormat(expense.Receipt_URL);
          doc.addImage(expense.Receipt_URL, format, currentX, currentY, imageWidth, imageHeight);
          doc.setFontSize(8);
          const expenseName = doc.splitTextToSize(expense.Expense_Name, imageWidth);
          doc.text(expenseName, currentX, currentY + imageHeight + 4);
        } catch (e) {
            console.error(`Could not add image for ${expense.Expense_Name}:`, e);
            doc.rect(currentX, currentY, imageWidth, imageHeight);
            doc.setFontSize(8);
            doc.text("Image error", currentX + 2, currentY + 10);
        }
        
        currentX += imageWidth + imagePadding;
      });
    }

    // Generate filename and save
    const filename = `Expense_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
            <h2 className="text-2xl font-bold text-slate-700">
                Expense History
            </h2>
            <button
              onClick={handleExportPDF}
              disabled={expenses.length === 0}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <DownloadIcon className="w-4 h-4" />
              Export PDF
            </button>
        </div>
        {expenses.length === 0 ? (
             <div className="text-center py-12 px-6">
                <h3 className="text-lg font-semibold text-slate-600">No Expenses Logged</h3>
                <p className="text-slate-500 mt-1">Your submitted expenses will appear here.</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                        <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Expense</th>
                        <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                        <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Status</th>
                        <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Receipt</th>
                        <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {expenses.map((expense, index) => (
                        <ExpenseListItem 
                          key={`${expense.Expense_Name}-${expense.Date}-${index}`} 
                          expense={expense}
                          onDelete={() => onDeleteExpense(index)}
                          onViewReceipt={onViewReceipt}
                        />
                    ))}
                    </tbody>
                    <tfoot>
                        {Object.entries(totalsByCurrency).map(([currency, total]) => (
                            <tr key={currency} className="bg-slate-100 border-t-2 border-slate-200">
                                <td colSpan={2} className="p-4 text-sm font-bold text-slate-600 text-right">Total ({currency})</td>
                                <td className="p-4 text-sm font-bold text-slate-800 text-right whitespace-nowrap">
                                    {new Intl.NumberFormat(undefined, { style: 'currency', currency: currency, minimumFractionDigits: 2 }).format(total)}
                                </td>
                                <td colSpan={3}></td>
                            </tr>
                        ))}
                    </tfoot>
                </table>
            </div>
        )}
    </div>
  );
};

export default ExpenseList;