import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ProtectedLayout from './components/ProtectedLayout';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Packages from './pages/Packages';
import Bookings from './pages/Bookings';
import Finance from './pages/Finance';
import Reports from './pages/Reports';
import Tasks from './pages/Tasks';
import Users from './pages/Users';
import ActivityLog from './pages/ActivityLog';
import Profile from './pages/Profile';
import ExpenseCategories from './pages/ExpenseCategories';
import { useApp } from './hooks/useApp';

const App: React.FC = () => {
  const { currentUser } = useApp();

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={currentUser ? <Navigate to="/dashboard" /> : <Login />} />
        <Route 
          path="/*"
          element={
            <ProtectedLayout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/packages" element={<Packages />} />
                <Route path="/bookings" element={<Bookings />} />
                <Route path="/finance" element={<Finance />} />
                {/* FIX: Add the route for the new Expense Categories page. */}
                <Route path="/expense-categories" element={<ExpenseCategories />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/users" element={<Users />} />
                <Route path="/activity-log" element={<ActivityLog />} />
                <Route path="/profile" element={<Profile />} />
              </Routes>
            </ProtectedLayout>
          }
        />
      </Routes>
    </HashRouter>
  );
};

export default App;