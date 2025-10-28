import React from 'react';
import { NavLink } from 'react-router-dom';
// FIX: Import LayoutGrid icon for the new Expense Categories link.
import { Home, Users, Package, Book, DollarSign, FileText, ClipboardCheck, UserCog, History, LayoutGrid } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import Logo from './Logo';

const Sidebar: React.FC = () => {
  const { t, language, currentUser } = useApp();

  const allNavItems = [
    { to: '/dashboard', label: t('dashboard'), icon: Home, roles: ['Admin', 'Manager', 'Staff'] },
    { to: '/bookings', label: t('bookings'), icon: Book, roles: ['Admin', 'Manager', 'Staff'] },
    { to: '/customers', label: t('customers'), icon: Users, roles: ['Admin', 'Manager', 'Staff'] },
    { to: '/packages', label: t('packages'), icon: Package, roles: ['Admin', 'Manager', 'Staff'] },
    { to: '/tasks', label: t('tasks'), icon: ClipboardCheck, roles: ['Admin', 'Manager', 'Staff'] },
    { to: '/finance', label: t('finance'), icon: DollarSign, roles: ['Admin'] },
    // FIX: Add a new sidebar link for Expense Categories.
    { to: '/expense-categories', label: t('expenseCategories'), icon: LayoutGrid, roles: ['Admin'] },
    { to: '/reports', label: t('reports'), icon: FileText, roles: ['Admin'] },
    { to: '/users', label: t('users'), icon: UserCog, roles: ['Admin'] },
    { to: '/activity-log', label: t('activityLog'), icon: History, roles: ['Admin'] },
  ];
  
  const navItems = allNavItems.filter(item => item.roles.includes(currentUser?.role || ''));

  const linkClasses = "flex items-center px-4 py-3 text-gray-700 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors duration-200 relative";
  const activeLinkClasses = "bg-primary text-white hover:bg-primary hover:text-white shadow-lg font-bold";

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-e rtl:border-s rtl:border-e-0">
      <div className="flex items-center justify-center h-20 border-b px-4">
        <Logo className="h-14" />
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : ''}`}
          >
            <item.icon className="w-5 h-5" />
            <span className={`mx-4 ${language === 'ar' ? 'font-cairo' : 'font-sans'}`}>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t">
          <p className="text-xs text-center text-gray-500">&copy; {new Date().getFullYear()} {t('companyName')}</p>
      </div>
    </aside>
  );
};

export default Sidebar;