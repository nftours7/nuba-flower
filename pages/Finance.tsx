import React, { useState, useMemo } from 'react';
import { useApp } from '../hooks/useApp';
import { TrendingUp, TrendingDown, PieChart, PlusCircle, DollarSign, Download } from 'lucide-react';
import Modal from '../components/Modal';
import ExpenseForm from '../components/ExpenseForm';
import PaymentForm from '../components/PaymentForm';
import type { Expense, Payment, Booking, Customer, Package } from '../types';
import { Navigate } from 'react-router-dom';
import DonutChart from '../components/DonutChart';
import ConfirmationModal from '../components/ConfirmationModal';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { logoBase64 } from '../data/logo';
import { amiriFont } from '../lib/amiri-font';


const FinanceCard: React.FC<{ title: string; amount: number; icon: React.ElementType, color: 'green' | 'red' | 'blue' }> = ({ title, amount, icon: Icon, color }) => {
    const colorMap = {
        green: { bg: 'bg-green-100', text: 'text-green-600' },
        red: { bg: 'bg-red-100', text: 'text-red-600' },
        blue: { bg: 'bg-blue-100', text: 'text-blue-600' }
    };

    return (
        <div className="p-6 bg-white rounded-xl shadow-md">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="text-2xl font-bold text-gray-800">EGP {amount.toLocaleString()}</p>
                </div>
                <div className={`p-3 rounded-full ${colorMap[color].bg}`}>
                    <Icon className={`w-6 h-6 ${colorMap[color].text}`} />
                </div>
            </div>
        </div>
    );
};


const Finance: React.FC = () => {
    const { t, language, payments, setPayments, expenses, setExpenses, addToast, currentUser, logActivity, bookings, customers, packages } = useApp();
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);

    if (currentUser?.role !== 'Admin') {
        return <Navigate to="/dashboard" replace />;
    }

    // Correctly calculate total income, expenses, and profit including ticket-only sales
    const ticketOnlyBookings = bookings.filter(b => b.isTicketOnly && b.ticketCostPrice && b.ticketTotalPaid);
    const ticketSaleRevenue = ticketOnlyBookings.reduce((sum, b) => sum + (b.ticketTotalPaid || 0), 0);
    const ticketCostExpense = ticketOnlyBookings.reduce((sum, b) => sum + (b.ticketCostPrice || 0), 0);
    
    const totalIncome = payments.reduce((sum, p) => sum + p.amount, 0) + ticketSaleRevenue;
    const totalExpensesValue = expenses.reduce((sum, e) => sum + e.amount, 0) + ticketCostExpense;
    const profit = totalIncome - totalExpensesValue;
    const totalTicketProfit = ticketSaleRevenue - ticketCostExpense;

     const expenseChartData = useMemo(() => {
        const data: { [key: string]: number } = {};
        expenses.forEach(expense => {
            data[expense.category] = (data[expense.category] || 0) + expense.amount;
        });

        return Object.entries(data).map(([label, value]) => ({ label, value }));
    }, [expenses]);

    const handleSaveExpense = (expenseData: Omit<Expense, 'id'>) => {
        const newExpense: Expense = {
            id: `E${Date.now()}`,
            ...expenseData,
        };
        setExpenses(prev => [newExpense, ...prev]);
        setIsExpenseModalOpen(false);
        addToast({
            title: t('success'),
            message: t('expenseAddedSuccess'),
            type: 'success'
        });
        logActivity('Created', 'Expense', newExpense.id, `of ${newExpense.amount.toLocaleString()} for ${newExpense.description}`);
    };

    const handleSavePayment = (paymentData: Omit<Payment, 'id'>) => {
        const newPayment: Payment = {
            id: `PAY${Date.now()}`,
            ...paymentData,
        };
        setPayments(prev => [newPayment, ...prev]);
        setIsPaymentModalOpen(false);
        addToast({
            title: t('success'),
            message: t('paymentAddedSuccess'),
            type: 'success'
        });
        logActivity('Created', 'Payment', newPayment.id, `of ${newPayment.amount.toLocaleString()} to Booking ${newPayment.bookingId}`);
    };
    
    const handleOpenReceiptModal = (payment: Payment) => {
        setReceiptPayment(payment);
        setIsReceiptModalOpen(true);
    };

    const generateEnglishReceipt = async (doc: jsPDF, payment: Payment, booking: Booking, customer: Customer, pkg: Package | undefined) => {
        doc.setFont('Helvetica', 'normal');

        const img = new Image();
        img.src = logoBase64;
        await new Promise(resolve => { if (img.complete) resolve(true); else img.onload = resolve; });
        const logoWidth = 45;
        const logoHeight = (logoWidth / img.width) * img.height;
        doc.addImage(logoBase64, 'JPEG', 14, 15, logoWidth, logoHeight);
        
        doc.setFontSize(26);
        doc.setTextColor(40);
        doc.text(t('receipt').toUpperCase(), 14, 70, { align: 'left' });
        doc.setLineWidth(0.5);
        doc.line(14, 73, 200, 73);

        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(`${t('receipt')} ID: ${payment.id}`, 14, 85, { align: 'left' });
        doc.text(`${t('paymentDate')}: ${new Date(payment.paymentDate).toLocaleDateString()}`, 14, 91, { align: 'left' });
        
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(t('billTo'), 14, 105, { align: 'left' });
        doc.setFontSize(10);
        doc.setTextColor(0,0,0);
        doc.text(`${customer.name}\n${customer.email}\n${customer.phone}`, 14, 111, { align: 'left' });
        
        let lastY = 130;

        const totalPackagePrice = booking.isTicketOnly ? (booking.ticketTotalPaid || 0) : (pkg?.price || 0);
        const totalPaidToDate = payments.filter(p => p.bookingId === booking.id).reduce((sum, p) => sum + p.amount, 0);
        const remainingBalance = totalPackagePrice - totalPaidToDate;

        autoTable(doc, {
            head: [[t('bookingSummary')]],
            body: [[`${t('bookingId')}: ${booking.id}`], [`${t('package')}: ${booking.isTicketOnly ? t('ticketOnlySale') : pkg?.name || 'N/A'}`]],
            startY: lastY, theme: 'plain', headStyles: { fillColor: [22, 101, 52], textColor: 255 },
        });
        lastY = (doc as any).lastAutoTable.finalY;
        
        autoTable(doc, {
            head: [[t('paymentDetails')]],
            body: [[`${t('paymentDate')}: ${new Date(payment.paymentDate).toLocaleDateString()}`], [`${t('paymentMethod')}: ${t(payment.method.replace(' ', '') as any)}`], [`${t('amount')}: EGP ${payment.amount.toLocaleString()}`]],
            startY: lastY + 5, theme: 'plain', headStyles: { fillColor: [71, 85, 105], textColor: 255 },
        });
        lastY = (doc as any).lastAutoTable.finalY;

        doc.setFontSize(12);
        doc.setTextColor(0,0,0);
        doc.setFont('Helvetica', 'normal');
        doc.text(`${t('totalPackagePrice')}:`, 140, lastY + 10, { align: 'right' });
        doc.text(`EGP ${totalPackagePrice.toLocaleString()}`, 200, lastY + 10, { align: 'right' });
        doc.text(`${t('totalPaidToDate')}:`, 140, lastY + 17, { align: 'right' });
        doc.text(`EGP ${totalPaidToDate.toLocaleString()}`, 200, lastY + 17, { align: 'right' });
        doc.setFont('Helvetica', 'bold');
        doc.text(`${t('remainingBalance')}:`, 140, lastY + 24, { align: 'right' });
        doc.text(`EGP ${remainingBalance.toLocaleString()}`, 200, lastY + 24, { align: 'right' });
    };

    const generateArabicReceipt = async (doc: jsPDF, payment: Payment, booking: Booking, customer: Customer, pkg: Package | undefined) => {
        doc.setFont('Amiri');
        
        const img = new Image();
        img.src = logoBase64;
        await new Promise(resolve => { if (img.complete) resolve(true); else img.onload = resolve; });
        const logoWidth = 45;
        const logoHeight = (logoWidth / img.width) * img.height;
        doc.addImage(logoBase64, 'JPEG', 150, 15, logoWidth, logoHeight);
        
        doc.setFontSize(26);
        doc.setTextColor(40);
        doc.text(t('receipt').toUpperCase(), 195, 70, { align: 'right' });
        doc.setLineWidth(0.5);
        doc.line(14, 73, 200, 73);

        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(`${t('receipt')} ID: ${payment.id}`, 195, 85, { align: 'right' });
        doc.text(`${t('paymentDate')}: ${new Date(payment.paymentDate).toLocaleDateString()}`, 195, 91, { align: 'right' });
        
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(t('billTo'), 195, 105, { align: 'right' });
        doc.setFontSize(10);
        doc.setTextColor(0,0,0);
        doc.text(`${customer.name}\n${customer.email}\n${customer.phone}`, 195, 111, { align: 'right' });
        
        let lastY = 130;

        const totalPackagePrice = booking.isTicketOnly ? (booking.ticketTotalPaid || 0) : (pkg?.price || 0);
        const totalPaidToDate = payments.filter(p => p.bookingId === booking.id).reduce((sum, p) => sum + p.amount, 0);
        const remainingBalance = totalPackagePrice - totalPaidToDate;
        
        const autoTableStyles = { styles: { font: 'Amiri', halign: 'right' }, headStyles: { font: 'Amiri', halign: 'right' } };

        autoTable(doc, {
            ...autoTableStyles,
            head: [[t('bookingSummary')]],
            body: [[`${booking.isTicketOnly ? t('ticketOnlySale') : pkg?.name || 'N/A'} :${t('package')}`], [`${booking.id} :${t('bookingId')}`]],
            startY: lastY, theme: 'plain', headStyles: { ...autoTableStyles.headStyles, fillColor: [22, 101, 52], textColor: 255 },
        });
        lastY = (doc as any).lastAutoTable.finalY;
        
        autoTable(doc, {
            ...autoTableStyles,
            head: [[t('paymentDetails')]],
            body: [[`${new Date(payment.paymentDate).toLocaleDateString()} :${t('paymentDate')}`], [`${t(payment.method.replace(' ', '') as any)} :${t('paymentMethod')}`], [`EGP ${payment.amount.toLocaleString()} :${t('amount')}`]],
            startY: lastY + 5, theme: 'plain', headStyles: { ...autoTableStyles.headStyles, fillColor: [71, 85, 105], textColor: 255 },
        });
        lastY = (doc as any).lastAutoTable.finalY;

        doc.setFontSize(12);
        doc.setTextColor(0,0,0);
        doc.text(`${t('totalPackagePrice')}:`, 195, lastY + 10, { align: 'right' });
        doc.text(`EGP ${totalPackagePrice.toLocaleString()}`, 170, lastY + 10, { align: 'right' });
        doc.text(`${t('totalPaidToDate')}:`, 195, lastY + 17, { align: 'right' });
        doc.text(`EGP ${totalPaidToDate.toLocaleString()}`, 170, lastY + 17, { align: 'right' });
        doc.text(`${t('remainingBalance')}:`, 195, lastY + 24, { align: 'right' });
        doc.text(`EGP ${remainingBalance.toLocaleString()}`, 170, lastY + 24, { align: 'right' });
    };

    const confirmGenerateReceipt = async () => {
        if (!receiptPayment) return;
        const booking = bookings.find(b => b.id === receiptPayment.bookingId);
        if (!booking) { addToast({ title: t('error'), message: t('genericError'), type: 'error' }); return; }
        const customer = customers.find(c => c.id === booking.customerId);
        if (!customer) { addToast({ title: t('error'), message: t('genericError'), type: 'error' }); return; }
        const pkg = packages.find(p => p.id === booking.packageId);

        try {
            const doc = new jsPDF();
            const isArabic = language === 'ar';
            
            if (isArabic) {
                const amiriFontB64 = amiriFont.split(',')[1];
                doc.addFileToVFS('Amiri-Regular.ttf', amiriFontB64);
                doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
                await generateArabicReceipt(doc, receiptPayment, booking, customer, pkg);
            } else {
                await generateEnglishReceipt(doc, receiptPayment, booking, customer, pkg);
            }

            doc.save(`Receipt-${receiptPayment.id}.pdf`);
            addToast({ title: t('success'), message: t('receiptGeneratedSuccess'), type: 'success' });
        } catch (error) {
            console.error('Error generating receipt PDF:', error);
            addToast({ title: t('error'), message: t('genericError'), type: 'error' });
        } finally {
            setIsReceiptModalOpen(false);
            setReceiptPayment(null);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h1 className="text-3xl font-bold text-gray-800">{t('financialOverview')}</h1>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setIsPaymentModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                    >
                        <PlusCircle className="w-5 h-5" />
                        <span>{t('addPayment')}</span>
                    </button>
                    <button 
                        onClick={() => setIsExpenseModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                    >
                        <PlusCircle className="w-5 h-5" />
                        <span>{t('addExpense')}</span>
                    </button>
                </div>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                 <FinanceCard title={t('income')} amount={totalIncome} icon={TrendingUp} color="green" />
                 <FinanceCard title={t('expenses')} amount={totalExpensesValue} icon={TrendingDown} color="red" />
                 <FinanceCard title={t('profit')} amount={profit} icon={PieChart} color="blue" />
                 <FinanceCard title={t('ticketProfit')} amount={totalTicketProfit} icon={DollarSign} color="blue" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-700">{t('recentPayments')}</h2>
                    </div>
                     <ul className="space-y-2">
                        {payments.length > 0 ? (
                            payments.slice(0, 5).map(p => {
                                const booking = bookings.find(b => b.id === p.bookingId);
                                const customer = booking ? customers.find(c => c.id === booking.customerId) : null;
                                const pkg = booking ? packages.find(pkg => pkg.id === booking.packageId) : null;

                                return (
                                    <li key={p.id} className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 transition-colors border-b last:border-b-0">
                                        <div>
                                            <p className="font-semibold text-gray-800">{customer?.name || t('noData')}</p>
                                            <p className="text-sm text-gray-600">{pkg?.name || (booking?.isTicketOnly ? t('ticketOnlySale') : t('noData'))}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {t('bookingId')}: {p.bookingId} | {new Date(p.paymentDate).toLocaleDateString()} | {p.method}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-lg text-green-600 whitespace-nowrap">+ EGP {p.amount.toLocaleString()}</p>
                                            <button 
                                                onClick={() => handleOpenReceiptModal(p)}
                                                className="p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-primary focus:outline-none"
                                                title={t('download')}
                                            >
                                                <Download className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </li>
                                );
                            })
                        ) : (
                            <p className="text-sm text-center py-4 text-gray-500">{t('noData')}</p>
                        )}
                    </ul>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Expense Distribution</h2>
                    <DonutChart data={expenseChartData} centerLabel={t('expenses')} />
                </div>
            </div>

             <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-700">{t('recentExpenses')}</h2>
                </div>
                {/* Expense list here */}
                <ul className="space-y-3">
                    {expenses.slice(0,5).map(e => (
                        <li key={e.id} className="flex justify-between items-center p-2 rounded hover:bg-gray-50">
                            <div>
                                <p className="font-medium text-gray-800">{e.description}</p>
                                <p className="text-xs text-gray-500">
                                    {e.paidTo ? `${t('paidTo')}: ${e.paidTo} | ` : ''}
                                    {new Date(e.expenseDate).toLocaleDateString()} - {e.category}
                                </p>
                            </div>
                            <p className="font-semibold text-red-600">- EGP {e.amount.toLocaleString()}</p>
                        </li>
                    ))}
                </ul>
            </div>

            <Modal
                isOpen={isExpenseModalOpen}
                onClose={() => setIsExpenseModalOpen(false)}
                title={t('addExpense')}
            >
                <ExpenseForm 
                    onSave={handleSaveExpense}
                    onCancel={() => setIsExpenseModalOpen(false)}
                />
            </Modal>

            <Modal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                title={t('addPayment')}
            >
                <PaymentForm
                    onSave={handleSavePayment}
                    onCancel={() => setIsPaymentModalOpen(false)}
                />
            </Modal>

            <ConfirmationModal
                isOpen={isReceiptModalOpen}
                onClose={() => setIsReceiptModalOpen(false)}
                onConfirm={confirmGenerateReceipt}
                title={t('receipt')}
                message={t('confirmReceiptGeneration')}
                confirmText={t('download')}
                icon={Download}
                iconColor="text-primary"
            />
        </div>
    );
};

export default Finance;
