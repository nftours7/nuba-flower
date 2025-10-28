import React from 'react';
import { Globe, User, LogOut } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import Logo from './Logo';
import { useNavigate, Link } from 'react-router-dom';

const Header: React.FC = () => {
  const { language, setLanguage, t, currentUser, logout } = useApp();
  const navigate = useNavigate();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="flex items-center h-16 px-6 bg-white border-b rtl:border-b-0 rtl:border-s">
      {/* Mobile Logo & Name */}
      <div className="flex-shrink-0 md:hidden flex items-center gap-3">
        <Logo className="h-10" />
        <span className="font-bold text-primary text-lg whitespace-nowrap">{t('companyName')}</span>
      </div>

      {/* Spacer */}
      <div className="flex-grow"></div>
      
      {/* Controls */}
      <div className="flex-shrink-0 flex items-center space-x-4 rtl:space-x-reverse">
        <button 
          onClick={toggleLanguage}
          className="p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring"
        >
          <Globe className="w-6 h-6" />
          <span className="sr-only">Toggle Language</span>
        </button>
        {currentUser && (
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Link to="/profile" className="flex items-center space-x-2 rtl:space-x-reverse p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="p-2 bg-gray-200 rounded-full">
                <User className="w-6 h-6 text-gray-600" />
              </div>
              <div className="text-sm">
                <p className="font-semibold text-gray-700">{currentUser.name}</p>
                <p className="text-gray-500">{t(currentUser.role)}</p>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-red-600 focus:outline-none focus:ring"
              title={t('logout')}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;