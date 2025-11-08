import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { PlusCircle, Edit, Trash2, Printer, Search, X, Book, Eye } from 'lucide-react';
import Modal from '../components/Modal';
import BookingForm from '../components/BookingForm';
import ConfirmationModal from '../components/ConfirmationModal';
import EmptyState from '../components/EmptyState';
import BookingDetailsModal from '../components/BookingDetailsModal';
import type { Booking, BookingStatus, Customer, Package, Payment } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { logoBase64 } from '../data/logo';

const statusColors: Record<BookingStatus, string> = {
    Pending: 'bg-yellow-100 text-yellow-800',
    Deposited: 'bg-cyan-100 text-cyan-800',
    Confirmed: 'bg-teal-100 text-teal-800',
    'Visa Processed': 'bg-blue-100 text-blue-800',
    Ticketed: 'bg-purple-100 text-purple-800',
    Departed: 'bg-indigo-100 text-indigo-800',
    Completed: 'bg-green-100 text-green-800',
    Cancelled: 'bg-red-100 text-red-800',
};

const bookingStatuses: BookingStatus[] = ['Pending', 'Deposited', 'Confirmed', 'Visa Processed', 'Ticketed', 'Departed', 'Completed', 'Cancelled'];

const Bookings: React.FC = () => {
    const { t, bookings, setBookings, customers, packages, payments, addToast, currentUser, logActivity } = useApp();
    const location = useLocation();
    const navigate = useNavigate();

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingBookingId, setDeletingBookingId] = useState<string | null>(null);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [invoiceBooking, setInvoiceBooking] = useState<Booking | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);

    // State for filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [packageTypeFilter, setPackageTypeFilter] = useState('All');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    useEffect(() => {
        if (location.state?.newBookingForPackageId) {
            handleOpenAddModal();
        }
    }, [location.state?.newBookingForPackageId]);

    const filteredBookings = useMemo(() => {
        return bookings.filter(b => {
            const customer = customers.find(c => c.id === b.customerId);
            const pkg = packages.find(p => p.id === b.packageId);

            const searchTermMatch = searchTerm === '' ||
                b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (customer && customer.name.toLowerCase().includes(searchTerm.toLowerCase()));

            const statusMatch = statusFilter === 'All' || b.status === statusFilter;
            
            const packageTypeMatch = packageTypeFilter === 'All' || b.isTicketOnly || (pkg && pkg.type === packageTypeFilter);
            
            const startDateMatch = startDate === '' || new Date(b.bookingDate) >= new Date(startDate);
            const endDateMatch = endDate === '' || new Date(b.bookingDate) <= new Date(endDate);
            
            return searchTermMatch && statusMatch && packageTypeMatch && startDateMatch && endDateMatch;
        });
    }, [bookings, customers, packages, searchTerm, statusFilter, packageTypeFilter, startDate, endDate]);

    const resetFilters = () => {
        setSearchTerm('');
        setStatusFilter('All');
        setPackageTypeFilter('All');
        setStartDate('');
        setEndDate('');
    }
    
    const getBookingDetailsForLog = (bookingId: string) => {
        const booking = bookings.find(b => b.id === bookingId);
        const customer = customers.find(c => c.id === booking?.customerId);
        return `Booking ${bookingId} for ${customer?.name || 'N/A'}`;
    };

    const handleSaveBooking = (bookingData: Omit<Booking, 'id'> & { id?: string }) => {
        const customerName = customers.find(c => c.id === bookingData.customerId)?.name || 'N/A';
        if (bookingData.id) {
            // Edit mode
            setBookings(prev => prev.map(b =>
                b.id === bookingData.id ? { ...b, ...bookingData, id: b.id } : b
            ));
            logActivity('Updated', 'Booking', bookingData.id, `Booking ${bookingData.id} for ${customerName}`);
        } else {
            // Add mode
            const newBookingId = `B${Date.now()}`;
            const newBooking: Booking = {
                ...bookingData,
                id: newBookingId,
            } as Booking;
            setBookings(prev => [newBooking, ...prev]);
            logActivity('Created', 'Booking', newBooking.id, `Booking ${newBooking.id} for ${customerName}`);
        }
        setIsFormModalOpen(false);
        setEditingBooking(null);
        addToast({
            title: t('success'),
            message: t('bookingSavedSuccess'),
            type: 'success',
        });
        if (location.state?.newBookingForPackageId) {
            navigate(location.pathname, { replace: true, state: {} });
        }
    };
    
    const handleOpenEditModal = (booking: Booking) => {
        setEditingBooking(booking);
        setIsFormModalOpen(true);
    };

    const handleOpenAddModal = () => {
        setEditingBooking(null);
        setIsFormModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsFormModalOpen(false);
        setEditingBooking(null);
    };

    const handleCloseModalWithStateClear = () => {
        handleCloseModal();
        if (location.state?.newBookingForPackageId) {
            navigate(location.pathname, { replace: true, state: {} });
        }
    };
    
    const handleOpenDetailsModal = (booking: Booking) => {
        setViewingBooking(booking);
        setIsDetailsModalOpen(true);
    };

    const handleCloseDetailsModal = () => {
        setViewingBooking(null);
        setIsDetailsModalOpen(false);
    };

    const handleDeleteBooking = (bookingId: string) => {
        setDeletingBookingId(bookingId);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteBooking = () => {
        if (!deletingBookingId) return;
        const details = getBookingDetailsForLog(deletingBookingId);
        setBookings(prev => prev.filter(b => b.id !== deletingBookingId));
        addToast({
            title: t('success'),
            message: t('bookingDeletedSuccess'),
            type: 'success',
        });
        logActivity('Deleted', 'Booking', deletingBookingId, details);
        setDeletingBookingId(null);
        setIsDeleteModalOpen(false);
    };

    const handleOpenInvoiceModal = (booking: Booking) => {
        setInvoiceBooking(booking);
        setIsInvoiceModalOpen(true);
    };

    const generateEnglishInvoice = async (doc: jsPDF, booking: Booking, customer: Customer, pkg: Package | undefined) => {
        doc.setFont('Helvetica');

        // Header
        const img = new Image();
        img.src = logoBase64;
        await new Promise(resolve => { if (img.complete) resolve(true); else img.onload = resolve; });
        const logoWidth = 45;
        const logoHeight = (logoWidth / img.width) * img.height;
        doc.addImage(logoBase64, 'JPEG', 14, 15, logoWidth, logoHeight);
        doc.setFontSize(20);
        doc.setTextColor(34, 197, 94);
        doc.text("Nuba Flower Tours", 65, 30, { align: 'left' });
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text("6 Sultan St. behind Egypt Air office, Aswan", 65, 38, { align: 'left' });
        doc.text("Mobile: +201098888525 - Email: nft7@gmail.com", 65, 44, { align: 'left' });

        // Invoice Title
        const invoiceTitle = booking.isTicketOnly ? t('flightTicketInvoice') : t('invoice');
        doc.setFontSize(26);
        doc.setTextColor(40);
        doc.text(invoiceTitle.toUpperCase(), 14, 70, { align: 'left' });
        doc.setLineWidth(0.5);
        doc.line(14, 73, 200, 73);

        // Invoice Details
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(`${t('bookingId')}: ${booking.id}`, 14, 85, { align: 'left' });
        doc.text(`${t('bookingDate')}: ${new Date(booking.bookingDate).toLocaleDateString()}`, 14, 91, { align: 'left' });
        doc.text(`${t('invoiceDate')}: ${new Date().toLocaleDateString()}`, 14, 97, { align: 'left' });
        
        // Customer Details
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(t('billTo'), 14, 110, { align: 'left' });
        doc.setFontSize(10);
        doc.setTextColor(0,0,0);
        const customerInfo = `${customer.name}\n${customer.email || 'N/A'}\n${customer.phone}\n${t('passportNumber')}: ${customer.passportNumber}`;
        doc.text(customerInfo, 14, 116, { align: 'left' });
        
        // Items Table
        let lastY = 140;
        const autoTableStyles = { theme: 'striped' as const, headStyles: { fillColor: [22, 101, 52] } };
        if (booking.isTicketOnly && booking.flightDetails) {
            autoTable(doc, { ...autoTableStyles, head: [[t('itemDescription'), t('invoiceDetails')]], body: [
                [t('airline'), `${booking.flightDetails.airline} - ${booking.flightDetails.flightNumber}`],
                [t('departureDate'), new Date(booking.flightDetails.departureDate).toLocaleDateString()],
                [t('returnDate'), new Date(booking.flightDetails.returnDate).toLocaleDateString()],
            ], startY: lastY });
            lastY = (doc as any).lastAutoTable.finalY;
        } else if (pkg) {
            let body: (string | number)[][] = [[t('package'), `${pkg.name} (${pkg.packageCode})`], [t('hotelMakkah'), pkg.hotelMakkah], [t('hotelMadinah'), pkg.hotelMadinah]];
            if (booking.withoutBed) { body.push([t('roomType'), t('withoutBedShort')]); }
            else { body.push([t('roomType'), booking.roomType || 'N/A'], [t('meals'), booking.meals ? t(booking.meals.replace(' ', '') as any) : 'N/A']); }
            if (booking.flightDetails) { body.push([t('airline'), `${booking.flightDetails.airline} - ${booking.flightDetails.flightNumber}`], [t('departureDate'), new Date(booking.flightDetails.departureDate).toLocaleDateString()], [t('returnDate'), new Date(booking.flightDetails.returnDate).toLocaleDateString()]); }
            autoTable(doc, { ...autoTableStyles, head: [[t('itemDescription'), t('invoiceDetails')]], body, startY: lastY });
            lastY = (doc as any).lastAutoTable.finalY;
        }

        // Payment History
        const relevantPayments = payments.filter(p => p.bookingId === booking.id);
        if (relevantPayments.length > 0) {
            doc.setFontSize(12);
            doc.setTextColor(40);
            doc.text(t('paymentHistory'), 14, lastY + 15, { align: 'left' });
            autoTable(doc, { 
                theme: 'grid', headStyles: { fillColor: [71, 85, 105] },
                head: [[t('paymentDate'), t('paymentMethod'), t('amount')]], 
                body: relevantPayments.map(p => [new Date(p.paymentDate).toLocaleDateString(), t(p.method.replace(' ', '') as any), `EGP ${p.amount.toLocaleString()}`]), 
                startY: lastY + 18, 
            });
            lastY = (doc as any).lastAutoTable.finalY;
        }
        
        // Financial Summary
        let finalYPos = lastY + 15;
        doc.setLineWidth(0.2);
        doc.line(140, finalYPos - 5, 200, finalYPos - 5);
        if (booking.isTicketOnly) {
            const paid = booking.ticketTotalPaid || 0;
            doc.setFontSize(14);
            doc.setFont('Helvetica', 'bold');
            doc.setTextColor(22, 163, 74);
            doc.text(`${t('totalAmount')}:`, 140, finalYPos + 7, { align: 'right' });
            doc.text(`EGP ${paid.toLocaleString()}`, 200, finalYPos + 7, { align: 'right' });
        } else {
            const price = pkg?.price || 0;
            const paid = payments.filter(p => p.bookingId === booking.id).reduce((sum, p) => sum + p.amount, 0);
            const due = price - paid;
            doc.setFontSize(12);
            doc.setFont('Helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
            doc.text(`${t('subtotal')}:`, 140, finalYPos, { align: 'right' });
            doc.text(`EGP ${price.toLocaleString()}`, 200, finalYPos, { align: 'right' });
            doc.text(`${t('amountPaid')}:`, 140, finalYPos + 7, { align: 'right' });
            doc.text(`EGP ${paid.toLocaleString()}`, 200, finalYPos + 7, { align: 'right' });
            doc.setFontSize(14);
            doc.setFont('Helvetica', 'bold');
            if (due > 0) doc.setTextColor(220, 38, 38); else doc.setTextColor(22, 163, 74);
            doc.text(`${t('amountDue')}:`, 140, finalYPos + 16, { align: 'right' });
            doc.text(`EGP ${due.toLocaleString()}`, 200, finalYPos + 16, { align: 'right' });
            finalYPos += 16;
        }

        // Terms & Notes
        const notes = "Notes & Terms:\n- Please verify all details on the invoice are correct.\n- Prices are subject to change based on seasonality and availability.\n- Cancellation policies apply as per the signed agreement.";
        const textLines = doc.splitTextToSize(notes, 180);
        const textHeight = textLines.length * 5; // Approximate height

        if (finalYPos + textHeight > doc.internal.pageSize.height - 20) { // Check if it fits
            doc.addPage();
            finalYPos = 20;
        }

        doc.setFontSize(9);
        doc.setTextColor(120);
        doc.text(notes, 14, finalYPos + 10);
        
        // Footer
        doc.setFontSize(8);
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(150);
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
        }
    };

    const confirmGenerateInvoice = async () => {
        if (!invoiceBooking) return;

        if (invoiceBooking.isTicketOnly && !invoiceBooking.flightDetails) {
            addToast({ title: t('error'), message: t('flightDetailsMissingForInvoice'), type: 'error' });
            setIsInvoiceModalOpen(false); setInvoiceBooking(null); return;
        }

        const customer = customers.find(c => c.id === invoiceBooking.customerId);
        if (!customer) {
            addToast({ title: t('error'), message: t('invoiceCustomerMissingError'), type: 'error' });
            setIsInvoiceModalOpen(false); setInvoiceBooking(null); return;
        }
        
        const pkg = packages.find(p => p.id === invoiceBooking.packageId);
        if (!invoiceBooking.isTicketOnly && !pkg) {
            addToast({ title: t('error'), message: t('invoicePackageMissingError'), type: 'error' });
            setIsInvoiceModalOpen(false); setInvoiceBooking(null); return;
        }

        try {
            const doc = new jsPDF();
            
            await generateEnglishInvoice(doc, invoiceBooking, customer, pkg);

            const safeCustomerName = customer.name.replace(/\s+/g, '_');
            doc.save(`Invoice-${safeCustomerName}-${invoiceBooking.id}.pdf`);
            addToast({ title: t('success'), message: t('invoiceGeneratedSuccess'), type: 'success' });

        } catch (error) {
            console.error('Error generating PDF:', error);
            addToast({ title: t('error'), message: t('genericError'), type: 'error' });
        } finally {
            setIsInvoiceModalOpen(false);
            setInvoiceBooking(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h1 className="text-3xl font-bold text-gray-800">{t('bookings')}</h1>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleOpenAddModal}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                    >
                        <PlusCircle className="w-5 h-5" />
                        <span>{t('addBooking')}</span>
                    </button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-md flex flex-col md:flex-row flex-wrap items-center gap-4">
                <div className="relative flex-grow w-full md:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder={t('searchBookings')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition-all duration-200"
                    />
                </div>
                <div className="w-full md:w-auto md:flex-shrink-0 md:w-48">
                    <label htmlFor="statusFilter" className="sr-only">{t('status')}</label>
                    <select id="statusFilter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition-all duration-200">
                        <option value="All">{t('all')} {t('status')}</option>
                        {bookingStatuses.map(status => (
                            <option key={status} value={status}>{t(status.replace(' ', '') as any)}</option>
                        ))}
                    </select>
                </div>
                 <div className="w-full md:w-auto md:flex-shrink-0 md:w-48">
                    <label htmlFor="packageTypeFilter" className="sr-only">{t('packageType')}</label>
                    <select id="packageTypeFilter" value={packageTypeFilter} onChange={e => setPackageTypeFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition-all duration-200">
                        <option value="All">{t('all')} {t('packageType')}</option>
                        <option value="Hajj">Hajj</option>
                        <option value="Umrah">Umrah</option>
                    </select>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <label htmlFor="startDate" className="text-sm font-medium text-gray-500 whitespace-nowrap">{t('bookingDateRange')}:</label>
                    <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition-all duration-200" />
                    <span className="text-gray-500">-</span>
                    <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition-all duration-200" />
                </div>
                 <button onClick={resetFilters} className="flex items-center justify-center gap-2 w-full md:w-auto px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                    <X className="w-4 h-4" />
                    <span>{t('resetFilters')}</span>
                </button>
            </div>
            
            {filteredBookings.length > 0 ? (
                <div className="bg-white p-4 rounded-xl shadow-md overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t('bookingId')}</th>
                                <th scope="col" className="px-6 py-3">{t('customer')}</th>
                                <th scope="col" className="px-6 py-3">{t('package')}</th>
                                <th scope="col" className="px-6 py-3">{t('roomType')}</th>
                                <th scope="col" className="px-6 py-3">{t('status')}</th>
                                <th scope="col" className="px-6 py-3">{t('financials')}</th>
                                <th scope="col" className="px-6 py-3 text-center">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBookings.map(booking => {
                                const customer = customers.find(c => c.id === booking.customerId);
                                const pkg = packages.find(p => p.id === booking.packageId);
                                const totalPaidForBooking = payments
                                    .filter(p => p.bookingId === booking.id)
                                    .reduce((sum, p) => sum + p.amount, 0);
                                const packagePrice = pkg?.price || 0;
                                const remaining = packagePrice - totalPaidForBooking;
                                return (
                                    <tr key={booking.id} className="bg-white border-b hover:bg-gray-50 transition-colors duration-150">
                                        <td className="px-6 py-4 font-medium text-gray-900">{booking.id}</td>
                                        <td className="px-6 py-4">{customer?.name}</td>
                                        <td className="px-6 py-4">
                                            {pkg?.name || (booking.isTicketOnly ? <span className="italic text-gray-500">{t('ticketOnlySale')}</span> : 'N/A')}
                                        </td>
                                        <td className="px-6 py-4">{booking.isTicketOnly ? 'N/A' : (booking.withoutBed ? <span className="text-gray-500 italic">{t('withoutBedShort')}</span> : booking.roomType)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[booking.status]}`}>
                                                {t(booking.status.replace(' ', '') as any)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {booking.isTicketOnly ? (
                                                <span className="font-semibold text-gray-800">
                                                    EGP {(booking.ticketTotalPaid || 0).toLocaleString()}
                                                </span>
                                            ) : (
                                                <>
                                                    <div className="text-sm">
                                                        <span className="font-semibold text-gray-800">
                                                            EGP {totalPaidForBooking.toLocaleString()}
                                                        </span>
                                                        <span className="text-gray-500"> / {packagePrice.toLocaleString()}</span>
                                                    </div>
                                                    {remaining > 0 && (
                                                        <div className="text-xs text-accent font-medium mt-1">
                                                            {`${t('remainingBalance')}: EGP ${remaining.toLocaleString()}`}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center items-center gap-4">
                                                <button onClick={() => handleOpenDetailsModal(booking)} className="text-gray-500 hover:text-gray-800" title={t('view')}>
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => handleOpenEditModal(booking)} className="text-blue-600 hover:text-blue-800" title={t('edit')}><Edit className="w-5 h-5" /></button>
                                                <button onClick={() => handleOpenInvoiceModal(booking)} className="text-gray-500 hover:text-gray-800" title={t('invoice')}>
                                                    <Printer className="w-5 h-5" />
                                                </button>
                                                {['Admin', 'Manager'].includes(currentUser?.role || '') && (
                                                    <button onClick={() => handleDeleteBooking(booking.id)} className="text-accent hover:text-red-800" title={t('delete')}><Trash2 className="w-5 h-5" /></button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <EmptyState
                    icon={Book}
                    title={searchTerm || statusFilter !== 'All' || packageTypeFilter !== 'All' || startDate || endDate ? t('noBookingsFound') : t('bookings')}
                    message={t('noBookingsFoundSub')}
                    actionText={bookings.length === 0 ? t('addNewBookingCTA') : t('resetFilters')}
                    onAction={bookings.length === 0 ? handleOpenAddModal : resetFilters}
                />
            )}

            <Modal
                isOpen={isFormModalOpen}
                onClose={handleCloseModalWithStateClear}
                title={editingBooking ? t('editBooking') : t('addBooking')}
            >
                <BookingForm 
                    onSave={handleSaveBooking}
                    onCancel={handleCloseModalWithStateClear}
                    booking={editingBooking}
                    initialPackageId={location.state?.newBookingForPackageId}
                />
            </Modal>

            {viewingBooking && (
                <BookingDetailsModal
                    isOpen={isDetailsModalOpen}
                    onClose={handleCloseDetailsModal}
                    booking={viewingBooking}
                    customer={customers.find(c => c.id === viewingBooking.customerId)}
                    pkg={packages.find(p => p.id === viewingBooking.packageId)}
                    bookingPayments={payments.filter(p => p.bookingId === viewingBooking.id)}
                />
            )}

             <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDeleteBooking}
                title={t('confirmDeletionTitle')}
                message={t('confirmDeleteBooking')}
            />
            
            {isInvoiceModalOpen && invoiceBooking && (() => {
                const customer = customers.find(c => c.id === invoiceBooking.customerId);
                const pkg = packages.find(p => p.id === invoiceBooking.packageId);
                const price = invoiceBooking.isTicketOnly ? invoiceBooking.ticketTotalPaid : pkg?.price;

                return (
                    <Modal
                        isOpen={isInvoiceModalOpen}
                        onClose={() => { setIsInvoiceModalOpen(false); setInvoiceBooking(null); }}
                        title={t('invoice')}
                    >
                        <div className="space-y-4">
                            <p className="text-gray-600">{t('confirmInvoiceGeneration')}</p>
                            <div className="p-4 bg-gray-50 rounded-lg border space-y-2 text-sm">
                                <div className="flex justify-between"><span className="font-semibold text-gray-500">{t('bookingId')}:</span> <span className="font-mono">{invoiceBooking.id}</span></div>
                                <div className="flex justify-between"><span className="font-semibold text-gray-500">{t('customer')}:</span> <span>{customer?.name || 'N/A'}</span></div>
                                <div className="flex justify-between"><span className="font-semibold text-gray-500">{t('package')}:</span> <span className="text-right">{invoiceBooking.isTicketOnly ? t('ticketOnlySale') : (pkg?.name || 'N/A')}</span></div>
                                <div className="flex justify-between font-bold text-base"><span className="font-semibold text-gray-500">{t('totalPackagePrice')}:</span> <span>EGP {price?.toLocaleString() || '0'}</span></div>
                            </div>
                            <div className="flex justify-end gap-4 pt-4 border-t mt-4">
                                <button
                                    type="button"
                                    onClick={() => { setIsInvoiceModalOpen(false); setInvoiceBooking(null); }}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmGenerateInvoice}
                                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors flex items-center gap-2"
                                >
                                    <Printer className="w-4 h-4" />
                                    {t('generatePDF')}
                                </button>
                            </div>
                        </div>
                    </Modal>
                );
            })()}
        </div>
    );
};

export default Bookings;
