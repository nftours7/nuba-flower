import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Customer, Package, Booking, Payment, Expense, Toast, Task, User, ActivityLogEntry, ActivityAction, ActivityEntity, ExpenseCategory } from '../types';
import { translations } from '../lib/localization';
import { mockBookings, mockCustomers, mockExpenses, mockPackages, mockPayments, mockTasks, mockUsers as initialUsers, mockExpenseCategories } from '../data/mock';

interface AppContextType {
  t: (key: keyof typeof translations.en, params?: Record<string, string>) => string;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  packages: Package[];
  setPackages: React.Dispatch<React.SetStateAction<Package[]>>;
  bookings: Booking[];
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
  payments: Payment[];
  setPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  expenseCategories: ExpenseCategory[];
  setExpenseCategories: React.Dispatch<React.SetStateAction<ExpenseCategory[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  activityLog: ActivityLogEntry[];
  logActivity: (action: ActivityAction, entity: ActivityEntity, entityId: string, details: string) => void;
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  currentUser: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

const USER_SESSION_KEY = 'nuba_flower_tours_user';
const APP_DATA_KEY = 'nuba_flower_tours_data';

const initialData = {
    customers: mockCustomers,
    packages: mockPackages,
    bookings: mockBookings,
    payments: mockPayments,
    expenses: mockExpenses,
    tasks: mockTasks,
    expenseCategories: mockExpenseCategories,
    users: initialUsers,
    activityLog: [],
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Load initial state from localStorage or use mock data
  const [appData, setAppData] = useState(() => {
    try {
      const storedData = localStorage.getItem(APP_DATA_KEY);
      if (storedData) {
        const parsed = JSON.parse(storedData);
        // Basic check to ensure stored data has the expected shape
        if(parsed.customers && parsed.users) return parsed;
      }
      return initialData;
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
      return initialData;
    }
  });

  const { customers, packages, bookings, payments, expenses, tasks, users, activityLog, expenseCategories } = appData;

  const setCustomers = (updater: React.SetStateAction<Customer[]>) => setAppData(d => ({ ...d, customers: typeof updater === 'function' ? updater(d.customers) : updater }));
  const setPackages = (updater: React.SetStateAction<Package[]>) => setAppData(d => ({ ...d, packages: typeof updater === 'function' ? updater(d.packages) : updater }));
  const setBookings = (updater: React.SetStateAction<Booking[]>) => setAppData(d => ({ ...d, bookings: typeof updater === 'function' ? updater(d.bookings) : updater }));
  const setPayments = (updater: React.SetStateAction<Payment[]>) => setAppData(d => ({ ...d, payments: typeof updater === 'function' ? updater(d.payments) : updater }));
  const setExpenses = (updater: React.SetStateAction<Expense[]>) => setAppData(d => ({ ...d, expenses: typeof updater === 'function' ? updater(d.expenses) : updater }));
  const setTasks = (updater: React.SetStateAction<Task[]>) => setAppData(d => ({ ...d, tasks: typeof updater === 'function' ? updater(d.tasks) : updater }));
  const setExpenseCategories = (updater: React.SetStateAction<ExpenseCategory[]>) => setAppData(d => ({ ...d, expenseCategories: typeof updater === 'function' ? updater(d.expenseCategories) : updater }));
  const setUsers = (updater: React.SetStateAction<User[]>) => setAppData(d => ({ ...d, users: typeof updater === 'function' ? updater(d.users) : updater }));
  const setActivityLog = (updater: React.SetStateAction<ActivityLogEntry[]>) => setAppData(d => ({ ...d, activityLog: typeof updater === 'function' ? updater(d.activityLog) : updater }));

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(APP_DATA_KEY, JSON.stringify(appData));
    } catch (error) {
      console.error("Failed to save data to localStorage", error);
    }
  }, [appData]);

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const storedUser = sessionStorage.getItem(USER_SESSION_KEY);
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      return null;
    }
  });

  const t = useCallback((key: keyof typeof translations.en, params?: Record<string, string>) => {
    let translation = translations.en[key] || key;
    if (params) {
      Object.keys(params).forEach(pKey => {
        translation = translation.replace(`{${pKey}}`, params[pKey]);
      });
    }
    return translation;
  }, []);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, ...toast }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };
  
  const login = (username: string, password: string): boolean => {
      const user = users.find(u => u.id === username && u.password === password);
      if (user) {
          const { password: _, ...userToStore } = user;
          setCurrentUser(userToStore);
          sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify(userToStore));
          return true;
      }
      return false;
  };

  const logout = () => {
      setCurrentUser(null);
      sessionStorage.removeItem(USER_SESSION_KEY);
  };
  
  const logActivity = useCallback((action: ActivityAction, entity: ActivityEntity, entityId: string, details: string) => {
    if (!currentUser) return;
    const newLogEntry: ActivityLogEntry = {
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: currentUser.name,
        action,
        entity,
        entityId,
        details,
    };
    setActivityLog(prev => [newLogEntry, ...prev]);
  }, [currentUser]);


  const value: AppContextType = {
    t,
    customers,
    setCustomers: setCustomers as React.Dispatch<React.SetStateAction<Customer[]>>,
    packages,
    setPackages: setPackages as React.Dispatch<React.SetStateAction<Package[]>>,
    bookings,
    setBookings: setBookings as React.Dispatch<React.SetStateAction<Booking[]>>,
    payments,
    setPayments: setPayments as React.Dispatch<React.SetStateAction<Payment[]>>,
    expenses,
    setExpenses: setExpenses as React.Dispatch<React.SetStateAction<Expense[]>>,
    tasks,
    setTasks: setTasks as React.Dispatch<React.SetStateAction<Task[]>>,
    expenseCategories,
    setExpenseCategories: setExpenseCategories as React.Dispatch<React.SetStateAction<ExpenseCategory[]>>,
    users,
    setUsers: setUsers as React.Dispatch<React.SetStateAction<User[]>>,
    activityLog,
    logActivity,
    toasts,
    addToast,
    removeToast,
    currentUser,
    login,
    logout,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};