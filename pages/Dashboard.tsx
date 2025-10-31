
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Users, BookOpenCheck, DollarSign, Briefcase, UserPlus, Receipt, Edit3, Trash2, CheckCircle, XCircle, PlusCircle } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import BarChart from '../components/BarChart';
import DonutChart from '../components/DonutChart';
import { ActivityLogEntry } from '../types';
// FIX: Import translations to correctly type the key for the t() function.
import { translations } from '../lib/localization';

const DashboardCard: React.FC<{ title: string; value: string; icon: React.ElementType }> = ({ title, value, icon: Icon }) => {
    return (
        <div className="p-6 bg-white rounded-xl shadow-md flex items-center justify-between transition-all hover:shadow-lg hover:scale-105">
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="text-3xl font-bold text-gray-800">{value}</p>
            </div>
            <div className="p-4 bg-primary/10 rounded-full">
                <Icon className="w-8 h-8 text-primary" />
            </div>
        </div>
    );
};

const Dashboard: React.FC = () => {
    const { t, customers, bookings, payments, expenses, packages, activityLog, currentUser } = useApp();
    
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const activeBookings = bookings.filter(b => !['Completed', 'Cancelled'].includes(b.status)).length;

    const financialChartData = useMemo(() => {
        const data: { [key: string]: { income: number, expenses: number } } = {};
        const monthOrder: string[] = [];

        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const month = d.toLocaleString('default', { month: 'short' });
            if(!monthOrder.includes(month)){
                monthOrder.push(month);
                data[month] = { income: 0, expenses: 0 };
            }
        }
        
        [...payments, ...expenses].forEach(item => {
            const date = 'paymentDate' in item ? item.paymentDate : item.expenseDate;
            const month = new Date(date).toLocaleString('default', { month: 'short' });
            if (data[month]) {
                if ('paymentDate' in item) {
                    data[month].income += item.amount;
                } else {
                    data[month].expenses += item.amount;
                }
            }
        });
        
        return {
            labels: monthOrder,
            datasets: [
                { label: t('income'), data: monthOrder.map(m => data[m]?.income || 0), color: '#22c55e' },
                { label: t('expenses'), data: monthOrder.map(m => data[m]?.expenses || 0), color: '#ef4444' }
            ]
        };
    }, [payments, expenses, t]);

    const packageChartData = useMemo(() => {
        const data: { [key: string]: number } = {};
        bookings.forEach(booking => {
            const pkg = packages.find(p => p.id === booking.packageId);
            if (pkg) {
                data[pkg.name] = (data[pkg.name] || 0) + 1;
            }
        });

        return Object.entries(data).map(([label, value]) => ({ label, value }));
    }, [bookings, packages]);
    
    const recentActivity = activityLog.slice(0, 5);

    const ActivityIcon: React.FC<{ entry: ActivityLogEntry }> = ({ entry }) => {
        const className = "w-5 h-5 text-white";
        switch(entry.action) {
            case 'Created': return <UserPlus className={className} />;
            case 'Updated': return <Edit3 className={className} />;
            case 'Deleted': return <Trash2 className={className} />;
            case 'Completed': return <CheckCircle className={className} />;
            case 'Incomplete': return <XCircle className={className} />;
            default: return null;
        }
    };
    
    const ActivityColor = ({ entry }: { entry: ActivityLogEntry }) => {
        switch(entry.action) {
            case 'Created': return 'bg-green-500';
            case 'Updated': return 'bg-blue-500';
            case 'Deleted': return 'bg-red-500';
            case 'Completed': return 'bg-purple-500';
            case 'Incomplete': return 'bg-yellow-500';
            default: return 'bg-gray-500';
        }
    }

    // FIX: Made activity log text rendering type-safe and more robust.
    // This avoids incorrect type assertions and provides a fallback for un-translated log messages.
    const renderActivityText = (entry: ActivityLogEntry) => {
        const key = `log${entry.action}${entry.entity}`;
        let details: Record<string, string> = { details: entry.details };
        
        // Custom details for payment/expense
        if (entry.entity === 'Payment' || entry.entity === 'Expense') {
            const match = entry.details.match(/of ([\d,]+) to (.+)/) || entry.details.match(/of ([\d,]+) for (.+)/);
            if (match) {
                 details = { amount: match[1], details: match[2] };
            }
        }
        
        if (entry.entity === 'Document') {
             const match = entry.details.match(/'(.+)' to (.+)/) || entry.details.match(/'(.+)' from (.+)/);
             if (match) {
                 details = { docName: match[1], details: match[2] };
             }
        }

        if (Object.prototype.hasOwnProperty.call(translations.en, key)) {
            return <p>{entry.user} <span className="text-gray-500">{t(key as keyof typeof translations.en, details)}</span></p>;
        }

        // Fallback for keys that don't have a specific translation.
        const actionText = t(entry.action as keyof typeof translations.en);
        return <p>{entry.user} <span className="text-gray-500">{`${actionText} ${entry.entity}: ${entry.details}`}</span></p>;
    }


    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">{t('welcomeMessage', { name: currentUser?.name || 'User' })}</h1>
                    <p className="text-gray-500 mt-1">{t('welcomeSub')}</p>
                </div>
                <div className="flex items-center gap-4">
                    <Link
                        to="/customers"
                        className="flex items-center gap-2 px-4 py-2 bg-white text-primary border border-primary rounded-lg hover:bg-primary/10 transition-colors"
                    >
                        <UserPlus className="w-5 h-5" />
                        <span>{t('addCustomer')}</span>
                    </Link>
                    <Link
                        to="/bookings"
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                    >
                        <PlusCircle className="w-5 h-5" />
                        <span>{t('addBooking')}</span>
                    </Link>
                </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <DashboardCard title={t('totalCustomers')} value={customers.length.toString()} icon={Users} />
                <DashboardCard title={t('activeBookings')} value={activeBookings.toString()} icon={BookOpenCheck} />
                <DashboardCard title={t('totalRevenue')} value={`EGP ${totalRevenue.toLocaleString()}`} icon={DollarSign} />
                <DashboardCard title={t('totalExpenses')} value={`EGP ${totalExpenses.toLocaleString()}`} icon={DollarSign} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">{t('financialPerformance')}</h2>
                    <BarChart data={financialChartData} />
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">{t('packagePopularity')}</h2>
                    {/* FIX: The DonutChart component requires a 'centerLabel' prop, which has been added. */}
                    <DonutChart data={packageChartData} centerLabel={t('bookings')} />
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-700">{t('recentActivity')}</h2>
                </div>
                <div className="space-y-4">
                   {recentActivity.map((activity) => (
                       <div key={activity.id} className="flex items-center gap-4 p-2 rounded-lg hover:bg-gray-50">
                           <div className={`p-3 rounded-full ${ActivityColor({entry: activity})}`}>
                               <ActivityIcon entry={activity} />
                           </div>
                           <div className="text-sm text-gray-600">
                               {renderActivityText(activity)}
                               <p className="text-xs text-gray-400">{new Date(activity.timestamp).toLocaleString()}</p>
                           </div>
                       </div>
                   ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;