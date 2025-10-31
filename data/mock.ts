import type { Customer, Package, Booking, Payment, Expense, Task, User, ExpenseCategory } from '../types';

export const mockUsers: User[] = [
  { id: 'admin', name: 'Admin User', role: 'Admin', password: 'admin_password' },
  { id: 'hassan.o', name: 'Hassan Omar', role: 'Manager', password: 'manager_password' },
  { id: 'ali.h', name: 'Ali Hassan', role: 'Staff', password: 'staff_password' },
  { id: 'mona.s', name: 'Mona Said', role: 'Staff', password: 'staff_password' },
];

export const mockCustomers: Customer[] = [
  { id: 'C001', name: 'Ahmed Mohamed', phone: '+201012345678', email: 'ahmed@email.com', passportNumber: 'A12345678', passportExpiry: '2028-05-10', documents: [], dateAdded: '2023-10-15', age: 35, gender: 'Male' },
  { id: 'C002', name: 'Fatima Ali', phone: '+201187654321', email: 'fatima@email.com', passportNumber: 'B87654321', passportExpiry: '2029-11-20', documents: [], dateAdded: '2023-10-18', age: 28, gender: 'Female' },
  { id: 'C003', name: 'Youssef Ibrahim', phone: '+201298765432', email: 'youssef@email.com', passportNumber: 'C54321678', passportExpiry: '2027-01-30', documents: [], dateAdded: '2023-11-01', age: 42, gender: 'Male' },
  { id: 'C004', name: 'Omar Ahmed', phone: '+201012345678', email: 'ahmed@email.com', passportNumber: 'D11122233', passportExpiry: '2030-01-01', documents: [], dateAdded: '2024-03-01', age: 5, gender: 'Male' },
  { id: 'C005', name: 'Sara Ali (Infant)', phone: '+201187654321', email: 'fatima@email.com', passportNumber: 'E44455566', passportExpiry: '2031-01-01', documents: [], dateAdded: '2024-03-01', age: 1, gender: 'Female' },
];

export const mockPackages: Package[] = [
  { id: 'P01', packageCode: 'UMR-ECO-15', name: '15-Day Umrah Economy', type: 'Umrah', duration: 15, price: 35000, description: 'Economy package for a 15-day Umrah trip.', hotelMakkah: 'Al Kiswah Towers', hotelMadinah: 'Dar Al Eiman Al Manar', includes: ['Visa', 'Accommodation'], isFeatured: false },
  { id: 'P02', packageCode: 'UMR-LUX-10', name: '10-Day Umrah 5-Star', type: 'Umrah', duration: 10, price: 60000, description: 'Luxury 5-star package for Umrah.', hotelMakkah: 'Fairmont Makkah Clock Royal Tower', hotelMadinah: 'Anwar Al Madinah Mövenpick', includes: ['Flights', 'Visa', '5-Star Hotels', 'Breakfast', 'Private Transport'], isFeatured: true },
  { id: 'P03', packageCode: 'HAJ-PREM-25', name: 'Hajj 2024 Premium', type: 'Hajj', duration: 25, price: 250000, description: 'Premium Hajj package with all services.', hotelMakkah: 'Raffles Makkah Palace', hotelMadinah: 'The Oberoi Madina', includes: ['All Inclusive', 'Flights'], isFeatured: true },
];

export const mockBookings: Booking[] = [
  { id: 'B001', customerId: 'C001', packageId: 'P01', bookingDate: '2023-11-05', status: 'Completed', roomType: 'Triple', meals: 'Full Board' },
  { id: 'B002', customerId: 'C002', packageId: 'P02', bookingDate: '2023-11-10', status: 'Ticketed', roomType: 'Double', meals: 'Breakfast', flightDetails: { airline: 'EgyptAir', flightNumber: 'MS644', departureDate: '2023-12-10', returnDate: '2023-12-20' } },
  { id: 'B003', customerId: 'C003', packageId: 'P01', bookingDate: '2023-11-12', status: 'Visa Processed', roomType: 'Quad', meals: 'Half Board' },
  { id: 'B004', customerId: 'C001', packageId: 'P03', bookingDate: '2024-01-20', status: 'Deposited', roomType: 'Double', meals: 'Only Bed', flightDetails: { airline: 'Saudia', flightNumber: 'SV302', departureDate: '2024-06-10', returnDate: '2024-07-05' } },
  { id: 'B005', customerId: 'C002', packageId: 'P01', bookingDate: '2024-02-01', status: 'Pending', roomType: 'Quintuple', meals: 'Breakfast' },
  { id: 'B006', customerId: 'C004', packageId: 'P02', bookingDate: '2024-03-05', status: 'Confirmed', withoutBed: true },
  { id: 'B007', customerId: 'C003', packageId: '', bookingDate: '2024-04-10', status: 'Ticketed', isTicketOnly: true, ticketCostPrice: 7500, ticketTotalPaid: 8200, flightDetails: { airline: 'Flynas', flightNumber: 'XY264', departureDate: '2024-05-20', returnDate: '2024-05-30' } },
];

export const mockPayments: Payment[] = [
  { id: 'PAY001', bookingId: 'B001', amount: 35000, paymentDate: '2023-11-05', method: 'Bank Transfer' },
  { id: 'PAY002', bookingId: 'B002', amount: 60000, paymentDate: '2023-11-10', method: 'Cash' },
  { id: 'PAY003', bookingId: 'B003', amount: 35000, paymentDate: '2023-11-12', method: 'Credit Card' },
  { id: 'PAY004', bookingId: 'B004', amount: 100000, paymentDate: '2024-01-20', method: 'Bank Transfer' },
  { id: 'PAY005', bookingId: 'B005', amount: 5000, paymentDate: '2024-02-01', method: 'Cash' },
  { id: 'PAY006', bookingId: 'B006', amount: 15000, paymentDate: '2024-03-05', method: 'Cash' },
];

export const mockExpenseCategories: ExpenseCategory[] = [
  { id: 'cat-1', name: 'Rent' },
  { id: 'cat-2', name: 'Bills' },
  { id: 'cat-3', name: 'Salaries' },
  { id: 'cat-4', name: 'Marketing' },
  { id: 'cat-5', name: 'Visa Fees' },
  { id: 'cat-6', name: 'Transportation' },
  { id: 'cat-7', name: 'Other' },
];

export const mockExpenses: Expense[] = [
  { id: 'E001', category: 'Rent', description: 'Office Rent - Nov 2023', amount: 15000, expenseDate: '2023-11-01', paidTo: 'Building Management' },
  { id: 'E002', category: 'Bills', description: 'Electricity and Internet', amount: 2500, expenseDate: '2023-11-25', paidTo: 'Utility Company', vatAmount: 350 },
  { id: 'E003', category: 'Salaries', description: 'Staff Salaries - Nov 2023', amount: 50000, expenseDate: '2023-11-30', paidTo: 'Employees' },
  { id: 'E004', category: 'Marketing', description: 'Social Media Campaign', amount: 5000, expenseDate: '2023-11-15', paidTo: 'Facebook Ads' },
];

export const mockTasks: Task[] = [
    { id: 'T001', title: 'Confirm flight tickets for Fatima Ali', bookingId: 'B002', dueDate: new Date().toISOString().split('T')[0], priority: 'High', isCompleted: false },
    { id: 'T002', title: 'Follow up on visa status for Youssef Ibrahim', bookingId: 'B003', dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], priority: 'Medium', isCompleted: false },
    { id: 'T003', title: 'Collect final payment from Ahmed Mohamed', bookingId: 'B004', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], priority: 'Medium', isCompleted: false },
    { id: 'T004', title: 'Prepare welcome kits for Hajj packages', dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], priority: 'Low', isCompleted: false },
    { id: 'T005', title: 'Arrange hotel transport for B001', bookingId: 'B001', dueDate: '2023-11-01', priority: 'High', isCompleted: true },
];