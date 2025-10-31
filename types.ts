

export type UserRole = 'Admin' | 'Manager' | 'Staff';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  password?: string; // Only for mock data, wouldn't exist in a real app's client-side types
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  passportNumber: string;
  passportExpiry: string;
  documents: DocumentFile[];
  dateAdded: string;
  age: number;
  gender: 'Male' | 'Female';
}

export interface DocumentFile {
  id: string;
  name: string;
  url: string; // In a real app, this would be a URL to the stored file
  type: 'passport' | 'photo' | 'other';
}

export interface Package {
  id: string;
  packageCode: string;
  name: string;
  type: 'Hajj' | 'Umrah';
  duration: number; // in days
  price: number; // in EGP
  description: string;
  hotelMakkah: string;
  hotelMadinah: string;
  includes: string[];
  isFeatured: boolean;
}

export type BookingStatus = 'Pending' | 'Deposited' | 'Confirmed' | 'Visa Processed' | 'Ticketed' | 'Departed' | 'Completed' | 'Cancelled';
export type MealType = 'Only Bed' | 'Breakfast' | 'Half Board' | 'Full Board';

export interface Booking {
  id: string;
  customerId: string;
  packageId: string;
  bookingDate: string;
  status: BookingStatus;
  flightDetails?: Flight;
  roomType?: 'Double' | 'Triple' | 'Quad' | 'Quintuple';
  meals?: MealType;
  withoutBed?: boolean;
  isTicketOnly?: boolean;
  ticketCostPrice?: number;
  ticketTotalPaid?: number;
}

export interface Flight {
  airline: string;
  flightNumber: string;
  departureDate: string;
  returnDate: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  paymentDate: string;
  method: 'Cash' | 'Bank Transfer' | 'Credit Card';
}

export interface ExpenseCategory {
    id: string;
    name: string;
}

export interface Expense {
  id:string;
  category: string;
  description: string;
  amount: number;
  expenseDate: string;
  vatAmount?: number;
  paidTo?: string;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  title: string;
}

export type TaskPriority = 'High' | 'Medium' | 'Low';

export interface Task {
  id: string;
  title: string;
  bookingId?: string;
  dueDate: string;
  priority: TaskPriority;
  isCompleted: boolean;
}

export type ActivityAction = 'Created' | 'Updated' | 'Deleted' | 'Completed' | 'Incomplete';
export type ActivityEntity = 'Customer' | 'Package' | 'Booking' | 'Payment' | 'Expense' | 'Task' | 'User' | 'Document' | 'ExpenseCategory';

export interface ActivityLogEntry {
    id: string;
    timestamp: string;
    user: string;
    action: ActivityAction;
    entity: ActivityEntity;
    entityId: string;
    details: string;
}