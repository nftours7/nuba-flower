import React, { useState, useEffect } from 'react';
import { useApp } from '../hooks/useApp';
import type { User, UserRole } from '../types';

interface UserFormProps {
    onSave: (user: { id: string, name: string, role: UserRole, password?: string }) => void;
    onCancel: () => void;
    user?: User | null;
}

const UserForm: React.FC<UserFormProps> = ({ onSave, onCancel, user }) => {
    const { t, users } = useApp();
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [role, setRole] = useState<UserRole>('Staff');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const isEditing = !!user;

    useEffect(() => {
        if (user) {
            setName(user.name);
            setUsername(user.id);
            setRole(user.role);
            setPassword('');
            setConfirmPassword('');
        } else {
            setName('');
            setUsername('');
            setRole('Staff');
            setPassword('');
            setConfirmPassword('');
        }
        setError('');
    }, [user]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!isEditing && users.some(u => u.id === username)) {
            setError(t('usernameExistsError'));
            return;
        }

        if (password !== confirmPassword) {
            setError(t('passwordsDoNotMatchError'));
            return;
        }

        if (!isEditing && !password) {
             setError(t('passwordRequiredError'));
             return;
        }
        
        const userData: { id: string, name: string, role: UserRole, password?: string } = {
            id: isEditing ? user!.id : username,
            name,
            role,
        };

        if (password) {
            userData.password = password;
        }
        
        onSave(userData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-500">{t('name')}</label>
                <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200"
                    required
                />
            </div>
            <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-500">{t('username')}</label>
                <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm disabled:bg-gray-100 transition-all duration-200"
                    required
                    disabled={isEditing}
                />
            </div>
            <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-500">{t('role')}</label>
                <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200"
                >
                    <option value="Staff">{t('Staff')}</option>
                    <option value="Manager">{t('Manager')}</option>
                    <option value="Admin">{t('Admin')}</option>
                </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-500">
                        {isEditing ? t('newPasswordOptional') : t('password')}
                    </label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200"
                        required={!isEditing}
                    />
                </div>
                <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-500">{t('confirmPassword')}</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200"
                        required={!!password}
                    />
                </div>
            </div>

            {error && <p className="text-sm text-red-600 text-center">{error}</p>}

            <div className="flex justify-end gap-4 pt-4 border-t mt-6">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400">{t('cancel')}</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">{t('save')}</button>
            </div>
        </form>
    );
};

export default UserForm;