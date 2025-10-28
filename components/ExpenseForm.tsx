import React, { useState } from 'react';
import { useApp } from '../hooks/useApp';
import type { Expense } from '../types';

interface ExpenseFormProps {
  onSave: (expense: Omit<Expense, 'id'>) => void;
  onCancel: () => void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onSave, onCancel }) => {
    const { t, expenseCategories } = useApp();
    const [category, setCategory] = useState<string>(expenseCategories[0]?.name || '');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState(0);
    const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
    const [vatAmount, setVatAmount] = useState<number | undefined>(undefined);
    const [paidTo, setPaidTo] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!description || amount <= 0 || !category) {
            alert('Please provide a valid description, amount and category.');
            return;
        }
        onSave({
            category,
            description,
            amount,
            expenseDate,
            vatAmount: vatAmount || undefined,
            paidTo,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-500">{t('category')}</label>
                <select 
                    id="category" 
                    value={category} 
                    onChange={e => setCategory(e.target.value)} 
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200"
                    required
                >
                    {expenseCategories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                </select>
            </div>
             <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-500">{t('description')}</label>
                <input 
                    type="text" 
                    id="description" 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200" 
                    required 
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-500">{t('amount')}</label>
                    <input 
                        type="number" 
                        id="amount" 
                        value={amount} 
                        onChange={e => setAmount(Number(e.target.value))} 
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200" 
                        required 
                        min="0.01"
                        step="0.01"
                    />
                </div>
                 <div>
                    <label htmlFor="vatAmount" className="block text-sm font-medium text-gray-500">{t('vatAmount')}</label>
                    <input 
                        type="number" 
                        id="vatAmount" 
                        value={vatAmount ?? ''}
                        onChange={e => setVatAmount(e.target.value ? Number(e.target.value) : undefined)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200" 
                        min="0"
                        step="0.01"
                    />
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="paidTo" className="block text-sm font-medium text-gray-500">{t('paidTo')}</label>
                    <input 
                        type="text" 
                        id="paidTo" 
                        value={paidTo} 
                        onChange={e => setPaidTo(e.target.value)} 
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200" 
                    />
                </div>
                 <div>
                    <label htmlFor="expenseDate" className="block text-sm font-medium text-gray-500">{t('paymentDate')}</label>
                    <input 
                        type="date" 
                        id="expenseDate" 
                        value={expenseDate} 
                        onChange={e => setExpenseDate(e.target.value)} 
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200" 
                        required 
                    />
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t mt-6">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors">{t('cancel')}</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors">{t('save')}</button>
            </div>
        </form>
    );
};

export default ExpenseForm;