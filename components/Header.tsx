
import React from 'react';
import { ReceiptIcon } from './icons';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b border-slate-200">
      <div className="container mx-auto px-4 md:px-8 py-4">
        <div className="flex items-center gap-3">
          <ReceiptIcon className="w-8 h-8 text-indigo-600" />
          <h1 className="text-2xl font-bold text-slate-800">
            AI Expense Extractor
          </h1>
        </div>
      </div>
    </header>
  );
};

export default Header;
