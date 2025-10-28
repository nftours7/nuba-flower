import React, { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { Search, X, History } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import { ActivityAction } from '../types';

const actionTypes: ActivityAction[] = ['Created', 'Updated', 'Deleted', 'Completed', 'Incomplete'];

const ActivityLog: React.FC = () => {
    const { t, activityLog, users, currentUser } = useApp();

    const [searchTerm, setSearchTerm] = useState('');
    const [userFilter, setUserFilter] = useState('All');
    const [actionFilter, setActionFilter] = useState('All');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    if (currentUser?.role !== 'Admin') {
        return <Navigate to="/dashboard" replace />;
    }

    const filteredLog = useMemo(() => {
        return activityLog.filter(log => {
            const searchTermMatch = searchTerm === '' ||
                log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.user.toLowerCase().includes(searchTerm.toLowerCase());
            
            const userMatch = userFilter === 'All' || log.user === userFilter;
            const actionMatch = actionFilter === 'All' || log.action === actionFilter;
            
            const logDate = new Date(log.timestamp);
            const startDateMatch = startDate === '' || logDate >= new Date(startDate);
            const endDateMatch = endDate === '' || logDate <= new Date(endDate + 'T23:59:59');

            return searchTermMatch && userMatch && actionMatch && startDateMatch && endDateMatch;
        });
    }, [activityLog, searchTerm, userFilter, actionFilter, startDate, endDate]);

    const resetFilters = () => {
        setSearchTerm('');
        setUserFilter('All');
        setActionFilter('All');
        setStartDate('');
        setEndDate('');
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">{t('activityLog')}</h1>

             <div className="bg-white p-4 rounded-xl shadow-md flex flex-col md:flex-row flex-wrap items-center gap-4">
                <div className="relative flex-grow w-full md:w-auto">
                    <Search className="absolute left-3 rtl:right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder={t('searchActivity')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 rtl:pr-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition-all duration-200"
                    />
                </div>
                <div className="w-full md:w-auto md:flex-shrink-0 md:w-48">
                    <label htmlFor="userFilter" className="sr-only">{t('user')}</label>
                    <select id="userFilter" value={userFilter} onChange={e => setUserFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition-all duration-200">
                        <option value="All">{t('all')} {t('users')}</option>
                        {users.map(user => (
                            <option key={user.id} value={user.name}>{user.name}</option>
                        ))}
                    </select>
                </div>
                 <div className="w-full md:w-auto md:flex-shrink-0 md:w-48">
                    <label htmlFor="actionFilter" className="sr-only">{t('actionType')}</label>
                    <select id="actionFilter" value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition-all duration-200">
                        <option value="All">{t('all')} {t('actions')}</option>
                        {actionTypes.map(action => (
                           <option key={action} value={action}>{t(action)}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition-all duration-200" />
                    <span className="text-gray-500">-</span>
                    <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition-all duration-200" />
                </div>
                 <button onClick={resetFilters} className="flex items-center justify-center gap-2 w-full md:w-auto px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                    <X className="w-4 h-4" />
                    <span>{t('resetFilters')}</span>
                </button>
            </div>

            {filteredLog.length > 0 ? (
                <div className="bg-white p-4 rounded-xl shadow-md overflow-x-auto">
                    <table className="w-full text-sm text-left rtl:text-right text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t('timestamp')}</th>
                                <th scope="col" className="px-6 py-3">{t('user')}</th>
                                <th scope="col" className="px-6 py-3">{t('action')}</th>
                                <th scope="col" className="px-6 py-3">{t('entity')}</th>
                                <th scope="col" className="px-6 py-3">{t('details')}</th>
                            </tr>
                        </thead>
                        <tbody>
                           {filteredLog.map(log => (
                               <tr key={log.id} className="bg-white border-b hover:bg-gray-50">
                                   <td className="px-6 py-4 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                                   <td className="px-6 py-4 font-medium text-gray-800">{log.user}</td>
                                   <td className="px-6 py-4">{t(log.action)}</td>
                                   <td className="px-6 py-4">{log.entity}</td>
                                   <td className="px-6 py-4">{log.details}</td>
                               </tr>
                           ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <EmptyState
                    icon={History}
                    title={t('noActivityFound')}
                    message={t('noActivityFoundSub')}
                    actionText={activityLog.length > 0 ? t('resetFilters') : undefined}
                    onAction={activityLog.length > 0 ? resetFilters : undefined}
                />
            )}
        </div>
    );
};

export default ActivityLog;