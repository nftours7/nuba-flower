import React, { useState, useMemo } from 'react';
import { useApp } from '../hooks/useApp';
import { PlusCircle, Edit, Trash2, Printer, Search, X, FileSpreadsheet, Book } from 'lucide-react';
import Modal from '../components/Modal';
import BookingForm from '../components/BookingForm';
import ConfirmationModal from '../components/ConfirmationModal';
import EmptyState from '../components/EmptyState';
import type { Booking, BookingStatus, Customer, Package, Payment } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { logoBase64 } from '../data/logo';
import { amiriFont } from '../lib/amiri-font';

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
    const { t, bookings, setBookings, customers, packages, payments, language, addToast, currentUser, logActivity } = useApp();
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingBookingId, setDeletingBookingId] = useState<string | null>(null);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [invoiceBooking, setInvoiceBooking] = useState<Booking | null>(null);

    // State for filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [packageTypeFilter, setPackageTypeFilter] = useState('All');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

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
        const customerInfo = `${customer.name}\n${customer.email}\n${customer.phone}\n${t('passportNumber')}: ${customer.passportNumber}`;
        doc.text(customerInfo, 14, 116, { align: 'left' });
        
        // Items Table
        let lastY = 140;
        const autoTableStyles = { theme: 'striped', headStyles: { fillColor: [22, 101, 52] } };
        if (booking.isTicketOnly && booking.flightDetails) {
            autoTable(doc, { ...autoTableStyles, head: [[t('itemDescription'), t('details')]], body: [
                [t('airline'), `${booking.flightDetails.airline} - ${booking.flightDetails.flightNumber}`],
                [t('departureDate'), new Date(booking.flightDetails.departureDate).toLocaleDateString()],
                [t('returnDate'), new Date(booking.flightDetails.returnDate).toLocaleDateString()],
            ], startY: lastY });
            lastY = (doc as any).lastAutoTable.finalY;
        } else if (pkg) {
            let body = [[t('package'), `${pkg.name} (${pkg.duration} ${t('duration')})`], [t('hotelMakkah'), pkg.hotelMakkah], [t('hotelMadinah'), pkg.hotelMadinah]];
            if (booking.withoutBed) { body.push([t('roomType'), t('withoutBedShort')]); }
            else { body.push([t('roomType'), booking.roomType || 'N/A'], [t('meals'), booking.meals ? t(booking.meals.replace(' ', '') as any) : 'N/A']); }
            if (booking.flightDetails) { body.push([t('airline'), `${booking.flightDetails.airline} - ${booking.flightDetails.flightNumber}`], [t('departureDate'), new Date(booking.flightDetails.departureDate).toLocaleDateString()], [t('returnDate'), new Date(booking.flightDetails.returnDate).toLocaleDateString()]); }
            autoTable(doc, { ...autoTableStyles, head: [[t('itemDescription'), t('details')]], body, startY: lastY });
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
        const finalYPos = lastY + 15;
        doc.setLineWidth(0.2);
        doc.line(140, finalYPos - 5, 200, finalYPos - 5);
        if (booking.isTicketOnly) {
            const paid = booking.ticketTotalPaid || 0;
            doc.setFontSize(14);
            doc.setFont('Helvetica', 'bold');
            doc.setTextColor(22, 163, 74);
            doc.text(`${t('totalPaid')}:`, 140, finalYPos + 7, { align: 'right' });
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
        }
        
        // Footer
        doc.setFontSize(8);
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(150);
        doc.text('Thank you for your business!', doc.internal.pageSize.width / 2, (doc.internal.pageSize.height) - 10, { align: 'center' });
    };

    const generateArabicInvoice = async (doc: jsPDF, booking: Booking, customer: Customer, pkg: Package | undefined) => {
        doc.setFont('Amiri');
        
        // Header
        const img = new Image();
        img.src = logoBase64;
        await new Promise(resolve => { if (img.complete) resolve(true); else img.onload = resolve; });
        const logoWidth = 45;
        const logoHeight = (logoWidth / img.width) * img.height;
        doc.addImage(logoBase64, 'JPEG', 150, 15, logoWidth, logoHeight);
        doc.setFontSize(20);
        doc.setTextColor(34, 197, 94);
        doc.text("زهرة النوبة للسياحة", 140, 30, { align: 'right' });
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text("6 شارع السلطان ابوالعلا خلف مكتب مصر الطيران, أسوان", 140, 38, { align: 'right' });
        doc.text("Mobile: +201098888525 - Email: nft7@gmail.com", 140, 44, { align: 'right' });

        // Invoice Title
        const invoiceTitle = booking.isTicketOnly ? t('flightTicketInvoice') : t('invoice');
        doc.setFontSize(26);
        doc.setTextColor(40);
        doc.text(invoiceTitle.toUpperCase(), 195, 70, { align: 'right' });
        doc.setLineWidth(0.5);
        doc.line(14, 73, 200, 73);

        // Invoice Details
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(`${t('bookingId')}: ${booking.id}`, 195, 85, { align: 'right' });
        doc.text(`${t('bookingDate')}: ${new Date(booking.bookingDate).toLocaleDateString()}`, 195, 91, { align: 'right' });
        doc.text(`${t('invoiceDate')}: ${new Date().toLocaleDateString()}`, 195, 97, { align: 'right' });
        
        // Customer Details
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(t('billTo'), 195, 110, { align: 'right' });
        doc.setFontSize(10);
        doc.setTextColor(0,0,0);
        const customerInfo = `${customer.name}\n${customer.email}\n${customer.phone}\n${t('passportNumber')}: ${customer.passportNumber}`;
        doc.text(customerInfo, 195, 116, { align: 'right' });
        
        // Items Table
        let lastY = 140;
        const autoTableStyles = { theme: 'striped', styles: { font: 'Amiri', halign: 'right' }, headStyles: { font: 'Amiri', halign: 'right', fillColor: [22, 101, 52] } };
        if (booking.isTicketOnly && booking.flightDetails) {
            autoTable(doc, { ...autoTableStyles, head: [[t('details'), t('itemDescription')]], body: [
                [`${booking.flightDetails.airline} - ${booking.flightDetails.flightNumber}`, t('airline')],
                [new Date(booking.flightDetails.departureDate).toLocaleDateString(), t('departureDate')],
                [new Date(booking.flightDetails.returnDate).toLocaleDateString(), t('returnDate')],
            ], startY: lastY });
            lastY = (doc as any).lastAutoTable.finalY;
        } else if (pkg) {
            let body = [[`${pkg.name} (${pkg.duration} ${t('duration')})`, t('package')], [pkg.hotelMakkah, t('hotelMakkah')], [pkg.hotelMadinah, t('hotelMadinah')]];
            if (booking.withoutBed) { body.push([t('withoutBedShort'), t('roomType')]); }
            else { body.push([booking.roomType || 'N/A', t('roomType')], [booking.meals ? t(booking.meals.replace(' ', '') as any) : 'N/A', t('meals')]); }
            if (booking.flightDetails) { body.push([`${booking.flightDetails.airline} - ${booking.flightDetails.flightNumber}`, t('airline')], [new Date(booking.flightDetails.departureDate).toLocaleDateString(), t('departureDate')], [new Date(booking.flightDetails.returnDate).toLocaleDateString(), t('returnDate')]); }
            autoTable(doc, { ...autoTableStyles, head: [[t('details'), t('itemDescription')]], body, startY: lastY });
            lastY = (doc as any).lastAutoTable.finalY;
        }

        // Payment History
        const relevantPayments = payments.filter(p => p.bookingId === booking.id);
        if (relevantPayments.length > 0) {
            doc.setFontSize(12);
            doc.setTextColor(40);
            doc.text(t('paymentHistory'), 195, lastY + 15, { align: 'right' });
            autoTable(doc, { 
                theme: 'grid', styles: { font: 'Amiri', halign: 'right' }, headStyles: { font: 'Amiri', halign: 'right', fillColor: [71, 85, 105] },
                head: [[t('amount'), t('paymentMethod'), t('paymentDate')]], 
                body: relevantPayments.map(p => [`EGP ${p.amount.toLocaleString()}`, t(p.method.replace(' ', '') as any), new Date(p.paymentDate).toLocaleDateString()]), 
                startY: lastY + 18, 
            });
            lastY = (doc as any).lastAutoTable.finalY;
        }
        
        // Financial Summary
        const finalYPos = lastY + 15;
        doc.setLineWidth(0.2);
        doc.line(140, finalYPos - 5, 200, finalYPos - 5);
        if (booking.isTicketOnly) {
            const paid = booking.ticketTotalPaid || 0;
            doc.setFontSize(14);
            doc.setTextColor(22, 163, 74);
            doc.text(`${t('totalPaid')}:`, 195, finalYPos + 7, { align: 'right' });
            doc.text(`EGP ${paid.toLocaleString()}`, 170, finalYPos + 7, { align: 'right' });
        } else {
            const price = pkg?.price || 0;
            const paid = payments.filter(p => p.bookingId === booking.id).reduce((sum, p) => sum + p.amount, 0);
            const due = price - paid;
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text(`${t('subtotal')}:`, 195, finalYPos, { align: 'right' });
            doc.text(`EGP ${price.toLocaleString()}`, 170, finalYPos, { align: 'right' });
            doc.text(`${t('amountPaid')}:`, 195, finalYPos + 7, { align: 'right' });
            doc.text(`EGP ${paid.toLocaleString()}`, 170, finalYPos + 7, { align: 'right' });
            doc.setFontSize(14);
            if (due > 0) doc.setTextColor(220, 38, 38); else doc.setTextColor(22, 163, 74);
            doc.text(`${t('amountDue')}:`, 195, finalYPos + 16, { align: 'right' });
            doc.text(`EGP ${due.toLocaleString()}`, 170, finalYPos + 16, { align: 'right' });
        }

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('Thank you for your business!', doc.internal.pageSize.width / 2, (doc.internal.pageSize.height) - 10, { align: 'center' });
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
            const isArabic = language === 'ar';

            if (isArabic) {
                const amiriFontB64 = amiriFont.split(',')[1];
                doc.addFileToVFS('Amiri-Regular.ttf', amiriFontB64);
                doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
                await generateArabicInvoice(doc, invoiceBooking, customer, pkg);
            } else {
                await generateEnglishInvoice(doc, invoiceBooking, customer, pkg);
            }

            doc.save(`Invoice-${invoiceBooking.id}.pdf`);
            addToast({ title: t('success'), message: t('invoiceGeneratedSuccess'), type: 'success' });

        } catch (error) {
            console.error('Error generating PDF:', error);
            addToast({ title: t('error'), message: t('genericError'), type: 'error' });
        } finally {
            setIsInvoiceModalOpen(false);
            setInvoiceBooking(null);
        }
    };

    const handleExportExcel = () => {
        if (filteredBookings.length === 0) {
            addToast({ title: t('error'), message: t('noDataToExport'), type: 'error' });
            return;
        }

        const dataToExport = filteredBookings.map(booking => {
            const customer = customers.find(c => c.id === booking.customerId);
            const pkg = packages.find(p => p.id === booking.packageId);
            const totalPaidForBooking = payments
                .filter(p => p.bookingId === booking.id)
                .reduce((sum, p) => sum + p.amount, 0);
            
            const commonData = {
                [t('bookingId')]: booking.id,
                [t('customerName')]: customer?.name || 'N/A',
                [t('passportNumber')]: customer?.passportNumber || 'N/A',
                [t('bookingDate')]: new Date(booking.bookingDate).toLocaleDateString(),
                [t('status')]: t(booking.status.replace(' ', '') as any),
                [t('airline')]: booking.flightDetails?.airline || 'N/A',
                [t('flightNumber')]: booking.flightDetails?.flightNumber || 'N/A',
                [t('departureDate')]: booking.flightDetails ? new Date(booking.flightDetails.departureDate).toLocaleDateString() : 'N/A',
                [t('returnDate')]: booking.flightDetails ? new Date(booking.flightDetails.returnDate).toLocaleDateString() : 'N/A',
            };

            if (booking.isTicketOnly) {
                return {
                    ...commonData,
                    [t('packageName')]: t('ticketOnlySale'),
                    [t('packageCode')]: 'N/A',
                    [t('roomType')]: 'N/A',
                    [t('meals')]: 'N/A',
                    [t('price')]: booking.ticketCostPrice,
                    [t('totalPaid')]: booking.ticketTotalPaid,
                    [t('amountDue')]: (booking.ticketTotalPaid || 0) - (booking.ticketCostPrice || 0), // Profit
                }
            }

            return {
                ...commonData,
                [t('packageName')]: pkg?.name || 'N/A',
                [t('packageCode')]: pkg?.packageCode || 'N/A',
                [t('roomType')]: booking.withoutBed ? t('withoutBedShort') : (booking.roomType || 'N/A'),
                [t('meals')]: booking.withoutBed ? 'N/A' : (booking.meals ? t(booking.meals.replace(' ', '') as any) : 'N/A'),
                [t('price')]: pkg?.price || 0,
                [t('totalPaid')]: totalPaidForBooking,
                [t('amountDue')]: (pkg?.price || 0) - totalPaidForBooking,
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const cols = Object.keys(dataToExport[0] || {}).map(key => ({ wch: Math.max(20, key.length + 2) }));
        worksheet['!cols'] = cols;
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Bookings');
        XLSX.writeFile(workbook, 'Bookings_Export.xlsx');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h1 className="text-3xl font-bold text-gray-800">{t('bookings')}</h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        disabled={filteredBookings.length === 0}
                    >
                        <FileSpreadsheet className="w-5 h-5" />
                        <span>{t('exportExcel')}</span>
                    </button>
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
                    <Search className="absolute left-3 rtl:right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder={t('searchBookings')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 rtl:pr-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition-all duration-200"
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
                    <table className="w-full text-sm text-left rtl:text-right text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t('bookingId')}</th>
                                <th scope="col" className="px-6 py-3">{t('customer')}</th>
                                <th scope="col" className="px-6 py-3">{t('package')}</th>
                                <th scope="col" className="px-6 py-3">{t('roomType')}</th>
                                <th scope="col" className="px-6 py-3">{t('status')}</th>
                                <th scope="col" className="px-6 py-3">{t('totalPaid')}</th>
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
                                        <td className="px-6 py-4">EGP {booking.isTicketOnly ? (booking.ticketTotalPaid || 0).toLocaleString() : totalPaidForBooking.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center items-center gap-4">
                                                <button onClick={() => handleOpenInvoiceModal(booking)} className="text-gray-500 hover:text-gray-800" title={t('invoice')}>
                                                    <Printer className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => handleOpenEditModal(booking)} className="text-blue-600 hover:text-blue-800" title={t('edit')}><Edit className="w-5 h-5" /></button>
                                                {currentUser?.role === 'Admin' && (
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
                onClose={handleCloseModal}
                title={editingBooking ? t('editBooking') : t('addBooking')}
            >
                <BookingForm 
                    onSave={handleSaveBooking}
                    onCancel={handleCloseModal}
                    booking={editingBooking}
                />
            </Modal>

             <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDeleteBooking}
                title={t('confirmDeletionTitle')}
                message={t('confirmDeleteBooking')}
            />
            <ConfirmationModal
                isOpen={isInvoiceModalOpen}
                onClose={() => setIsInvoiceModalOpen(false)}
                onConfirm={confirmGenerateInvoice}
                title={t('invoice')}
                message={t('confirmInvoiceGeneration')}
                confirmText={t('generatePDF')}
                icon={Printer}
                iconColor="text-primary"
            />
        </div>
    );
};

export default Bookings;
