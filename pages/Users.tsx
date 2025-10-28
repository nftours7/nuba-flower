import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { PlusCircle, Edit, Trash2, Users as UsersIcon, UserPlus } from 'lucide-react';
import Modal from '../components/Modal';
import UserForm from '../components/UserForm';
import ConfirmationModal from '../components/ConfirmationModal';
import EmptyState from '../components/EmptyState';
import type { User, UserRole } from '../types';

const Users: React.FC = () => {
    const { t, users, setUsers, addToast, currentUser, logActivity } = useApp();

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

    // Security: Only Admins can access this page
    if (currentUser?.role !== 'Admin') {
        return <Navigate to="/dashboard" replace />;
    }

    const handleSaveUser = (userData: { id: string, name: string, role: UserRole, password?: string }) => {
        const userIndex = users.findIndex(u => u.id === userData.id);

        if (userIndex > -1) {
            // Edit mode
            setUsers(prev => {
                const newUsers = [...prev];
                const existingUser = newUsers[userIndex];
                newUsers[userIndex] = {
                    ...existingUser,
                    name: userData.name,
                    role: userData.role,
                    password: userData.password || existingUser.password,
                };
                return newUsers;
            });
            logActivity('Updated', 'User', userData.id, `${userData.name} (${userData.role})`);
        } else {
            // Add mode
            const newUser: User = {
                id: userData.id,
                name: userData.name,
                role: userData.role,
                password: userData.password!, // Password is required for new users by the form
            };
            setUsers(prev => [newUser, ...prev]);
            logActivity('Created', 'User', newUser.id, `${newUser.name} (${newUser.role})`);
        }

        setIsFormModalOpen(false);
        setEditingUser(null);
        addToast({
            title: t('success'),
            message: t('userSavedSuccess'),
            type: 'success',
        });
    };

    const handleDeleteUser = (userId: string) => {
        if (userId === currentUser?.id) {
            addToast({ title: t('error'), message: t('cannotDeleteSelfError'), type: 'error' });
            return;
        }
        setDeletingUserId(userId);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteUser = () => {
        if (!deletingUserId) return;
        const userToDelete = users.find(u => u.id === deletingUserId);
        if(userToDelete){
            setUsers(prev => prev.filter(u => u.id !== deletingUserId));
            addToast({ title: t('success'), message: t('userDeletedSuccess'), type: 'success' });
            logActivity('Deleted', 'User', deletingUserId, `${userToDelete.name} (${userToDelete.role})`);
        }
        setDeletingUserId(null);
        setIsDeleteModalOpen(false);
    };

    const handleOpenEditModal = (user: User) => {
        setEditingUser(user);
        setIsFormModalOpen(true);
    };

    const handleOpenAddModal = () => {
        setEditingUser(null);
        setIsFormModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsFormModalOpen(false);
        setEditingUser(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-800">{t('users')}</h1>
                <button
                    onClick={handleOpenAddModal}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                    <UserPlus className="w-5 h-5" />
                    <span>{t('addUser')}</span>
                </button>
            </div>

            {users.length > 0 ? (
                <div className="bg-white p-4 rounded-xl shadow-md overflow-x-auto">
                    <table className="w-full text-sm text-left rtl:text-right text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t('name')}</th>
                                <th scope="col" className="px-6 py-3">{t('username')}</th>
                                <th scope="col" className="px-6 py-3">{t('role')}</th>
                                <th scope="col" className="px-6 py-3 text-center">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} className="bg-white border-b hover:bg-gray-50 transition-colors duration-150">
                                    <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                                    <td className="px-6 py-4">{user.id}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                            user.role === 'Admin' ? 'bg-blue-100 text-blue-800' :
                                            user.role === 'Manager' ? 'bg-green-100 text-green-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {t(user.role)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center items-center gap-4">
                                            <button onClick={() => handleOpenEditModal(user)} className="text-blue-600 hover:text-blue-800" title={t('edit')}><Edit className="w-5 h-5" /></button>
                                            <button onClick={() => handleDeleteUser(user.id)} className="text-accent hover:text-red-800" title={t('delete')}><Trash2 className="w-5 h-5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <EmptyState
                    icon={UsersIcon}
                    title={t('noUsersFound')}
                    message={t('noUsersFoundSub')}
                    actionText={t('addUser')}
                    onAction={handleOpenAddModal}
                />
            )}

            <Modal
                isOpen={isFormModalOpen}
                onClose={handleCloseModal}
                title={editingUser ? t('editUser') : t('addUser')}
            >
                <UserForm
                    onSave={handleSaveUser}
                    onCancel={handleCloseModal}
                    user={editingUser}
                />
            </Modal>
            
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDeleteUser}
                title={t('confirmDeletionTitle')}
                message={t('confirmDeleteUserMessage')}
            />
        </div>
    );
};

export default Users;