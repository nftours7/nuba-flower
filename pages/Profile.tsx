import React, { useState } from 'react';
import { useApp } from '../hooks/useApp';
import { User, Lock } from 'lucide-react';

const Profile: React.FC = () => {
    const { t, currentUser, users, setUsers, addToast } = useApp();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    if (!currentUser) {
        return null; // Or a loading state/redirect
    }

    const handleChangePassword = (e: React.FormEvent) => {
        e.preventDefault();

        const userInDb = users.find(u => u.id === currentUser.id);

        if (!userInDb || userInDb.password !== currentPassword) {
            addToast({ title: t('error'), message: t('currentPasswordIncorrect'), type: 'error' });
            return;
        }

        if (newPassword !== confirmNewPassword) {
            addToast({ title: t('error'), message: t('passwordsDoNotMatchError'), type: 'error' });
            return;
        }

        if (!newPassword) {
            addToast({ title: t('error'), message: t('fillRequiredFieldsWarning'), type: 'error' });
            return;
        }
        
        // Update user password
        setUsers(prevUsers => 
            prevUsers.map(u => 
                u.id === currentUser.id ? { ...u, password: newPassword } : u
            )
        );
        
        addToast({ title: t('success'), message: t('passwordChangedSuccess'), type: 'success' });
        
        // Reset form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
    };


    return (
        <div className="space-y-8 max-w-4xl mx-auto animate-fade-in">
            <h1 className="text-3xl font-bold text-gray-800">{t('profile')}</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* User Info Card */}
                <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-md flex flex-col items-center text-center">
                    <div className="p-4 bg-primary/10 rounded-full mb-4">
                        <User className="w-12 h-12 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">{currentUser.name}</h2>
                    <p className="text-gray-500">@{currentUser.id}</p>
                    <span className={`mt-3 px-3 py-1 text-sm font-semibold rounded-full ${
                        currentUser.role === 'Admin' ? 'bg-blue-100 text-blue-800' :
                        currentUser.role === 'Manager' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                        {t(currentUser.role)}
                    </span>
                </div>

                {/* Change Password Form */}
                <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <Lock className="w-5 h-5" />
                        {t('changePassword')}
                    </h3>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-500">{t('currentPassword')}</label>
                            <input
                                type="password"
                                id="currentPassword"
                                value={currentPassword}
                                onChange={e => setCurrentPassword(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-500">{t('newPassword')}</label>
                            <input
                                type="password"
                                id="newPassword"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-500">{t('confirmNewPassword')}</label>
                            <input
                                type="password"
                                id="confirmNewPassword"
                                value={confirmNewPassword}
                                onChange={e => setConfirmNewPassword(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                required
                            />
                        </div>
                        <div className="flex justify-end pt-2">
                             <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors">
                                {t('save')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;