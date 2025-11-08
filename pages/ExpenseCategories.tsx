import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { PlusCircle, Edit, Trash2, LayoutGrid } from 'lucide-react';
import Modal from '../components/Modal';
import ExpenseCategoryForm from '../components/ExpenseCategoryForm';
import ConfirmationModal from '../components/ConfirmationModal';
import EmptyState from '../components/EmptyState';
import type { ExpenseCategory } from '../types';

const ExpenseCategories: React.FC = () => {
    const { t, expenseCategories, setExpenseCategories, addToast, currentUser, logActivity } = useApp();

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);

    // Security: Only Admins and Managers can access this page
    if (!['Admin', 'Manager'].includes(currentUser?.role || '')) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleSaveCategory = (categoryData: { id?: string, name: string }) => {
        if (categoryData.id) {
            // Edit mode
            setExpenseCategories(prev => prev.map(c => 
                c.id === categoryData.id ? { ...c, name: categoryData.name } : c
            ));
            logActivity('Updated', 'ExpenseCategory', categoryData.id, categoryData.name);
        } else {
            // Add mode
            const newCategory: ExpenseCategory = {
                id: `cat-${Date.now()}`,
                name: categoryData.name,
            };
            setExpenseCategories(prev => [newCategory, ...prev]);
            logActivity('Created', 'ExpenseCategory', newCategory.id, newCategory.name);
        }

        setIsFormModalOpen(false);
        setEditingCategory(null);
        addToast({
            title: t('success'),
            message: t('categorySavedSuccess'),
            type: 'success',
        });
    };

    const handleDeleteCategory = (categoryId: string) => {
        setDeletingCategoryId(categoryId);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteCategory = () => {
        if (!deletingCategoryId) return;
        const categoryToDelete = expenseCategories.find(c => c.id === deletingCategoryId);
        if (categoryToDelete) {
            setExpenseCategories(prev => prev.filter(c => c.id !== deletingCategoryId));
            addToast({ title: t('success'), message: t('categoryDeletedSuccess'), type: 'success' });
            logActivity('Deleted', 'ExpenseCategory', deletingCategoryId, categoryToDelete.name);
        }
        setDeletingCategoryId(null);
        setIsDeleteModalOpen(false);
    };

    const handleOpenEditModal = (category: ExpenseCategory) => {
        setEditingCategory(category);
        setIsFormModalOpen(true);
    };

    const handleOpenAddModal = () => {
        setEditingCategory(null);
        setIsFormModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsFormModalOpen(false);
        setEditingCategory(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-800">{t('expenseCategories')}</h1>
                <button
                    onClick={handleOpenAddModal}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                    <PlusCircle className="w-5 h-5" />
                    <span>{t('addCategory')}</span>
                </button>
            </div>

            {expenseCategories.length > 0 ? (
                <div className="bg-white p-4 rounded-xl shadow-md overflow-x-auto">
                    <table className="w-full text-sm text-left rtl:text-right text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t('categoryName')}</th>
                                <th scope="col" className="px-6 py-3 text-center">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenseCategories.map(category => (
                                <tr key={category.id} className="bg-white border-b hover:bg-gray-50 transition-colors duration-150">
                                    <td className="px-6 py-4 font-medium text-gray-900">{category.name}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center items-center gap-4">
                                            <button onClick={() => handleOpenEditModal(category)} className="text-blue-600 hover:text-blue-800" title={t('edit')}><Edit className="w-5 h-5" /></button>
                                            <button onClick={() => handleDeleteCategory(category.id)} className="text-accent hover:text-red-800" title={t('delete')}><Trash2 className="w-5 h-5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <EmptyState
                    icon={LayoutGrid}
                    title={t('noCategoriesFound')}
                    message={t('noCategoriesFoundSub')}
                    actionText={t('addCategory')}
                    onAction={handleOpenAddModal}
                />
            )}

            <Modal
                isOpen={isFormModalOpen}
                onClose={handleCloseModal}
                title={editingCategory ? t('editCategory') : t('addCategory')}
            >
                <ExpenseCategoryForm
                    onSave={handleSaveCategory}
                    onCancel={handleCloseModal}
                    category={editingCategory}
                />
            </Modal>
            
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDeleteCategory}
                title={t('confirmDeletionTitle')}
                message={t('confirmDeleteCategoryMessage')}
            />
        </div>
    );
};

export default ExpenseCategories;