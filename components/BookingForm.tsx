import React, { useState, useEffect } from 'react';
import { useApp } from '../hooks/useApp';
import type { Booking, Customer, Flight, Package, BookingStatus, MealType } from '../types';
import { UserPlus, Plus, Minus, Package as PackageIcon, Ticket } from 'lucide-react';
import Modal from './Modal';
import CustomerForm from './CustomerForm';


const mealOptions: MealType[] = ['Only Bed', 'Breakfast', 'Half Board', 'Full Board'];
const bookingStatuses: BookingStatus[] = ['Pending', 'Deposited', 'Confirmed', 'Visa Processed', 'Ticketed', 'Departed', 'Completed', 'Cancelled'];

interface BookingFormProps {
  onSave: (booking: Omit<Booking, 'id'> & { id?: string }) => void;
  onCancel: () => void;
  booking?: Booking | null;
}

const BookingForm: React.FC<BookingFormProps> = ({ onSave, onCancel, booking }) => {
    const { t, customers, setCustomers, packages, bookings, addToast, logActivity } = useApp();
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    
    // Form state
    const [bookingType, setBookingType] = useState<'package' | 'ticket' | null>(null);
    const [customerId, setCustomerId] = useState('');
    const [packageId, setPackageId] = useState('');
    const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState<BookingStatus>('Pending');
    const [totalPaid, setTotalPaid] = useState(0);
    const [roomType, setRoomType] = useState<Booking['roomType']>('Double');
    const [meals, setMeals] = useState<MealType>('Breakfast');
    const [withoutBed, setWithoutBed] = useState(false);
    const [isTicketOnly, setIsTicketOnly] = useState(false);
    const [ticketCostPrice, setTicketCostPrice] = useState(0);
    const [ticketTotalPaid, setTicketTotalPaid] = useState(0);
    const [showFlightDetails, setShowFlightDetails] = useState(false);
    const [airline, setAirline] = useState('');
    const [flightNumber, setFlightNumber] = useState('');
    const [departureDate, setFlightDepartureDate] = useState('');
    const [returnDate, setFlightReturnDate] = useState('');
    const [passportWarning, setPassportWarning] = useState<string | null>(null);


    const selectedCustomer = customers.find(c => c.id === customerId);
    const isChild = selectedCustomer && selectedCustomer.age < 10;
    
    useEffect(() => {
        if (booking) { // Edit mode
            const type = booking.isTicketOnly ? 'ticket' : 'package';
            setBookingType(type);
            setCustomerId(booking.customerId);
            setPackageId(booking.packageId);
            setBookingDate(booking.bookingDate);
            setStatus(booking.status);
            setTotalPaid(booking.totalPaid);
            setRoomType(booking.roomType || 'Double');
            setMeals(booking.meals || 'Breakfast');
            setWithoutBed(booking.withoutBed || false);
            setIsTicketOnly(booking.isTicketOnly || false);
            setTicketCostPrice(booking.ticketCostPrice || 0);
            setTicketTotalPaid(booking.ticketTotalPaid || 0);
            if (booking.flightDetails) {
                setShowFlightDetails(true);
                setAirline(booking.flightDetails.airline);
                setFlightNumber(booking.flightDetails.flightNumber);
                setFlightDepartureDate(booking.flightDetails.departureDate);
                setFlightReturnDate(booking.flightDetails.returnDate);
            } else {
                setShowFlightDetails(false);
                setAirline(''); setFlightNumber(''); setFlightDepartureDate(''); setFlightReturnDate('');
            }
        } else { // Add mode
            setBookingType(null); // Show selection screen first
            // Reset fields to default
            const firstCustomer = customers[0];
            setCustomerId(firstCustomer?.id || '');
            setPackageId(packages[0]?.id || '');
            setBookingDate(new Date().toISOString().split('T')[0]);
            setStatus('Pending');
            setTotalPaid(0);
            setRoomType('Double');
            setMeals('Breakfast');
            setWithoutBed(firstCustomer ? firstCustomer.age < 10 : false);
            setIsTicketOnly(false);
            setTicketCostPrice(0);
            setTicketTotalPaid(0);
            setShowFlightDetails(false);
            setAirline(''); setFlightNumber(''); setFlightDepartureDate(''); setFlightReturnDate('');
        }
    }, [booking, customers, packages, bookings]);
    
    useEffect(() => {
        const currentCustomer = customers.find(c => c.id === customerId);
        if (currentCustomer && currentCustomer.age < 10) {
            setWithoutBed(true);
        } else {
            setWithoutBed(false);
        }
    }, [customerId, customers]);

    useEffect(() => {
        // Only run validation if we have the necessary details and flight info is relevant
        if ((showFlightDetails || isTicketOnly) && departureDate && customerId) {
            const customer = customers.find(c => c.id === customerId);
            if (customer && customer.passportExpiry) {
                const departure = new Date(departureDate);
                const expiry = new Date(customer.passportExpiry);
                const minExpiryDate = new Date(departure);
                minExpiryDate.setMonth(minExpiryDate.getMonth() + 6);

                if (expiry < minExpiryDate) {
                    setPassportWarning(t('passportExpiryWarning'));
                } else {
                    setPassportWarning(null); // Clear warning if valid
                }
            } else {
                 setPassportWarning(null); // Clear warning if no expiry date on record
            }
        } else {
            setPassportWarning(null); // Clear warning if not applicable
        }
    }, [departureDate, customerId, customers, t, showFlightDetails, isTicketOnly]);

    // FIX: Automatically set status to Ticketed for ticket-only sales when flight details are complete.
    useEffect(() => {
        if (isTicketOnly && airline && flightNumber && departureDate && returnDate) {
            setStatus('Ticketed');
        }
    }, [isTicketOnly, airline, flightNumber, departureDate, returnDate]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!customerId || (!isTicketOnly && !packageId)) {
            addToast({ title: t('error'), message: t('fillRequiredFieldsWarning'), type: 'error' });
            return;
        }
        if (isTicketOnly && (ticketCostPrice <= 0 || ticketTotalPaid <= 0)) {
            addToast({ title: t('error'), message: t('fillRequiredFieldsWarning'), type: 'error' });
            return;
        }
        const flightDetailsRequired = isTicketOnly || (status === 'Ticketed' && showFlightDetails);
        if (flightDetailsRequired && (!airline || !flightNumber || !departureDate || !returnDate)) {
             addToast({ title: t('error'), message: t('flightDetailsRequiredForTicketed'), type: 'error' });
             return;
        }
        const flightDetails = (showFlightDetails || isTicketOnly) && airline && flightNumber && departureDate && returnDate
            ? { airline, flightNumber, departureDate, returnDate }
            : undefined;
        if (flightDetails && departureDate) {
            const customer = customers.find(c => c.id === customerId);
            if (customer && customer.passportExpiry) {
                const departure = new Date(departureDate);
                const expiry = new Date(customer.passportExpiry);
                const minExpiryDate = new Date(departure);
                minExpiryDate.setMonth(minExpiryDate.getMonth() + 6);
                if (expiry < minExpiryDate) {
                    addToast({ title: t('error'), message: t('passportExpiryWarning'), type: 'error' });
                    return;
                }
            }
        }
        onSave({
            id: booking?.id,
            customerId,
            packageId: isTicketOnly ? '' : packageId,
            bookingDate,
            status,
            totalPaid: isTicketOnly ? 0 : totalPaid,
            roomType: isTicketOnly || withoutBed ? undefined : roomType,
            meals: isTicketOnly || withoutBed ? undefined : meals,
            withoutBed: isTicketOnly ? false : withoutBed,
            isTicketOnly,
            ticketCostPrice: isTicketOnly ? ticketCostPrice : undefined,
            ticketTotalPaid: isTicketOnly ? ticketTotalPaid : undefined,
            flightDetails,
        });
    };

    const handleSaveNewCustomer = (customerData: Omit<Customer, 'documents' | 'dateAdded' | 'id'>) => {
        const newCustomer: Customer = {
            id: `C${Date.now()}`,
            name: customerData.name,
            phone: customerData.phone,
            email: customerData.email,
            passportNumber: customerData.passportNumber,
            passportExpiry: customerData.passportExpiry,
            documents: [],
            dateAdded: new Date().toISOString().split('T')[0],
            age: customerData.age,
            gender: customerData.gender,
        };
        setCustomers(prev => [newCustomer, ...prev]);
        logActivity('Created', 'Customer', newCustomer.id, newCustomer.name);
        addToast({ title: t('success'), message: t('customerSavedSuccess'), type: 'success' });
        setCustomerId(newCustomer.id);
        setIsCustomerModalOpen(false);
    };
    
    // Show selection screen for new bookings
    if (!booking && !bookingType) {
        return (
            <div className="space-y-6">
                <h3 className="text-xl font-semibold text-center text-gray-800">{t('selectBookingType')}</h3>
                <div className="grid grid-cols-1 gap-4">
                    <button
                        type="button"
                        onClick={() => { setBookingType('package'); setIsTicketOnly(false); }}
                        className="p-6 text-left border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary transition-all flex items-center gap-4"
                    >
                        <PackageIcon className="w-8 h-8 text-primary flex-shrink-0" />
                        <div>
                            <h4 className="font-bold text-lg text-primary">{t('packageBooking')}</h4>
                            <p className="mt-1 text-sm text-gray-500">{t('packageBookingDescription')}</p>
                        </div>
                    </button>
                    <button
                        type="button"
                        onClick={() => { setBookingType('ticket'); setIsTicketOnly(true); }}
                        className="p-6 text-left border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary transition-all flex items-center gap-4"
                    >
                        <Ticket className="w-8 h-8 text-primary flex-shrink-0" />
                        <div>
                             <h4 className="font-bold text-lg text-primary">{t('ticketOnlySale')}</h4>
                            <p className="mt-1 text-sm text-gray-500">{t('ticketOnlyBookingDescription')}</p>
                        </div>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="customer" className="block text-sm font-medium text-gray-500">{t('customer')}</label>
                     <div className="flex items-center gap-2 mt-1">
                        <select id="customer" value={customerId} onChange={e => setCustomerId(e.target.value)} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200" required>
                            <option value="" disabled>Select a customer</option>
                            {customers.map(c => (
                                <option key={c.id} value={c.id}>{c.name} (Age: {c.age})</option>
                            ))}
                        </select>
                        <button 
                            type="button" 
                            onClick={() => setIsCustomerModalOpen(true)}
                            title={t('addCustomer')}
                            className="p-2.5 bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors flex-shrink-0"
                        >
                            <UserPlus className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {passportWarning && (
                    <div className="p-3 my-2 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 text-sm rounded-r-md">
                        <p>{passportWarning}</p>
                    </div>
                )}

                {bookingType === 'package' && (
                <div className="animate-fade-in space-y-4">
                    <div>
                        <label htmlFor="package" className="block text-sm font-medium text-gray-500">{t('package')}</label>
                        <select id="package" value={packageId} onChange={e => setPackageId(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200" required={!isTicketOnly}>
                            <option value="" disabled>Select a package</option>
                            {packages.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="totalPaid" className="block text-sm font-medium text-gray-500">{t('totalPaid')}</label>
                        <input type="number" id="totalPaid" value={totalPaid} onChange={e => setTotalPaid(Number(e.target.value))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200" required />
                    </div>
                    {isChild && (
                        <div className="pt-2">
                            <label className="flex items-center space-x-2 rtl:space-x-reverse cursor-pointer bg-yellow-50 p-3 rounded-md border border-yellow-200">
                                <input 
                                    type="checkbox" 
                                    checked={withoutBed}
                                    onChange={e => setWithoutBed(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <span className="text-sm font-medium text-yellow-800">{t('withoutBed')}</span>
                            </label>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="roomType" className="block text-sm font-medium text-gray-500">{t('roomType')}</label>
                            <select id="roomType" value={roomType} onChange={e => setRoomType(e.target.value as any)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed" disabled={withoutBed}>
                                <option value="Double">Double</option>
                                <option value="Triple">Triple</option>
                                <option value="Quad">Quad</option>
                                <option value="Quintuple">{t('hotelRoomingListQuint')}</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="meals" className="block text-sm font-medium text-gray-500">{t('meals')}</label>
                            <select id="meals" value={meals} onChange={e => setMeals(e.target.value as any)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed" disabled={withoutBed}>
                                {mealOptions.map(option => (
                                <option key={option} value={option}>{t(option.replace(' ', '') as any)}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
                )}
                
                {bookingType === 'ticket' && (
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50/50 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label htmlFor="ticketCostPrice" className="block text-sm font-medium text-gray-500">{t('ticketCostPrice')}</label>
                            <input type="number" id="ticketCostPrice" value={ticketCostPrice} onChange={e => setTicketCostPrice(Number(e.target.value))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200" required />
                        </div>
                        <div>
                            <label htmlFor="ticketTotalPaid" className="block text-sm font-medium text-gray-500">{t('ticketTotalPaid')}</label>
                            <input type="number" id="ticketTotalPaid" value={ticketTotalPaid} onChange={e => setTicketTotalPaid(Number(e.target.value))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200" required />
                        </div>
                    </div>
                </div>
                )}
                
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="bookingDate" className="block text-sm font-medium text-gray-500">{t('bookingDate')}</label>
                        <input type="date" id="bookingDate" value={bookingDate} onChange={e => setBookingDate(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200" required />
                    </div>
                     <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-500">{t('status')}</label>
                        <select id="status" value={status} onChange={e => setStatus(e.target.value as any)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200">
                            {bookingStatuses.map(s => (
                               <option key={s} value={s}>{t(s.replace(' ', '') as any)}</option>
                            ))}
                        </select>
                    </div>
                </div>
                
                {bookingType === 'package' && (
                    <div className="pt-2">
                        <button type="button" onClick={() => setShowFlightDetails(prev => !prev)} className="flex items-center gap-2 text-sm text-primary font-medium">
                            {showFlightDetails ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            {showFlightDetails ? t('removeFlightDetails') : t('addFlightDetails')}
                        </button>
                    </div>
                )}
                
                {(showFlightDetails || bookingType === 'ticket') && (
                     <div className="space-y-4 p-4 border rounded-lg bg-gray-50/50 animate-fade-in">
                        <h4 className="font-semibold text-md text-gray-800">{t('addFlightDetails')}</h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="airline" className="block text-sm font-medium text-gray-500">{t('airline')}</label>
                                <input type="text" id="airline" value={airline} onChange={e => setAirline(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200" required={isTicketOnly || (status === 'Ticketed' && showFlightDetails)} />
                            </div>
                             <div>
                                <label htmlFor="flightNumber" className="block text-sm font-medium text-gray-500">{t('flightNumber')}</label>
                                <input type="text" id="flightNumber" value={flightNumber} onChange={e => setFlightNumber(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200" required={isTicketOnly || (status === 'Ticketed' && showFlightDetails)} />
                            </div>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="departureDate" className="block text-sm font-medium text-gray-500">{t('departureDate')}</label>
                                <input type="date" id="departureDate" value={departureDate} onChange={e => setFlightDepartureDate(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200" required={isTicketOnly || (status === 'Ticketed' && showFlightDetails)} />
                            </div>
                             <div>
                                <label htmlFor="returnDate" className="block text-sm font-medium text-gray-500">{t('returnDate')}</label>
                                <input type="date" id="returnDate" value={returnDate} onChange={e => setFlightReturnDate(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200" required={isTicketOnly || (status === 'Ticketed' && showFlightDetails)} />
                            </div>
                        </div>
                     </div>
                )}
                
                <div className="flex justify-end gap-4 pt-4 border-t mt-6">
                    <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors">{t('cancel')}</button>
                    <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors">{t('save')}</button>
                </div>
            </form>
            <Modal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} title={t('addCustomer')}>
                <CustomerForm
                    onSave={handleSaveNewCustomer as any}
                    onCancel={() => setIsCustomerModalOpen(false)}
                    flightDepartureDate={departureDate}
                />
            </Modal>
        </>
    );
};

export default BookingForm;