import React, { useEffect, ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import Sidebar from './Sidebar';
import Header from './Header';
import ToastContainer from './ToastContainer';

const ProtectedLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser, language } = useApp();
  const location = useLocation();

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.body.className = language === 'ar' ? 'font-cairo' : 'font-sans';
  }, [language]);

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className={`flex h-screen bg-gray-100 text-gray-800 ${language === 'ar' ? 'font-cairo' : 'font-sans'}`}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-8">
          {children}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
};

export default ProtectedLayout;