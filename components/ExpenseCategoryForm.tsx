import React, { useState, useEffect } from 'react';
import { useApp } from '../hooks/useApp';
// FIX: Changed import to use the newly defined ExpenseCategory interface.
import type { ExpenseCategory } from '../types';

interface ExpenseCategoryFormProps {
    onSave: (category: { id?: string, name: string }) => void;
    onCancel: () => void;
    category?: ExpenseCategory | null;
}

const ExpenseCategoryForm: React.FC<ExpenseCategoryFormProps> = ({ onSave, onCancel, category }) => {
    const { t } = useApp();
    const [name, setName] = useState('');

    useEffect(() => {
        if (category) {
            setName(category.name);
        } else {
            setName('');
        }
    }, [category]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            return;
        }
        onSave({
            id: category?.id,
            name: name.trim(),
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                {/* FIX: The key 'categoryName' is now defined in translations. */}
                <label htmlFor="categoryName" className="block text-sm font-medium text-gray-500">{t('categoryName')}</label>
                <input
                    type="text"
                    id="categoryName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200"
                    required
                    autoFocus
                />
            </div>
            <div className="flex justify-end gap-4 pt-4 border-t mt-6">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors">{t('cancel')}</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors">{t('save')}</button>
            </div>
        </form>
    );
};

export default ExpenseCategoryForm;