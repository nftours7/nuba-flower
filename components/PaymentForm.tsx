import React, { useState, useEffect } from 'react';
import { useApp } from '../hooks/useApp';
import type { Payment } from '../types';

interface PaymentFormProps {
  onSave: (payment: Omit<Payment, 'id'>) => void;
  onCancel: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ onSave, onCancel }) => {
    const { t, bookings, customers, packages } = useApp();
    const [bookingId, setBookingId] = useState('');
    const [amount, setAmount] = useState(0);
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [method, setMethod] = useState<'Cash' | 'Bank Transfer' | 'Credit Card'>('Cash');
    
    const paymentMethods: Payment['method'][] = ['Cash', 'Bank Transfer', 'Credit Card'];

    useEffect(() => {
        // Set default booking if available
        if (bookings.length > 0) {
            setBookingId(bookings[0].id);
        }
    }, [bookings]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!bookingId || amount <= 0) {
            alert('Please select a booking and enter a valid amount.');
            return;
        }
        onSave({
            bookingId,
            amount,
            paymentDate,
            method,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="bookingId" className="block text-sm font-medium text-gray-500">{t('bookingId')}</label>
                <select 
                    id="bookingId" 
                    value={bookingId} 
                    onChange={e => setBookingId(e.target.value)} 
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200"
                    required
                >
                    <option value="" disabled>{t('selectBooking')}</option>
                    {bookings.map(b => {
                        const customer = customers.find(c => c.id === b.customerId);
                        const pkg = packages.find(p => p.id === b.packageId);
                        return (
                            <option key={b.id} value={b.id}>
                                {b.id} - {customer?.name} ({pkg?.name})
                            </option>
                        );
                    })}
                </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-500">{t('amount')}</label>
                    <input 
                        type="number" 
                        id="amount" 
                        value={amount} 
                        onChange={e => setAmount(Number(e.target.value))} 
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200" 
                        required
                        min="0.01"
                        step="0.01"
                    />
                </div>
                <div>
                    <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-500">{t('paymentDate')}</label>
                    <input 
                        type="date" 
                        id="paymentDate" 
                        value={paymentDate} 
                        onChange={e => setPaymentDate(e.target.value)} 
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200" 
                        required 
                    />
                </div>
            </div>

            <div>
                <label htmlFor="method" className="block text-sm font-medium text-gray-500">{t('paymentMethod')}</label>
                <select 
                    id="method" 
                    value={method} 
                    onChange={e => setMethod(e.target.value as any)} 
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200"
                >
                    {paymentMethods.map(m => (
                        <option key={m} value={m}>{m}</option>
                    ))}
                </select>
            </div>
            
            <div className="flex justify-end gap-4 pt-4 border-t mt-6">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors">{t('cancel')}</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors">{t('save')}</button>
            </div>
        </form>
    );
};

export default PaymentForm;