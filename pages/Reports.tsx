import React, { useState } from 'react';
import { useApp } from '../hooks/useApp';
import { FileText, FileSpreadsheet } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Navigate } from 'react-router-dom';
import { amiriFont } from '../lib/amiri-font';

const Reports: React.FC = () => {
    const { t, language, customers, bookings, packages, payments, expenses, currentUser } = useApp();
    const [reportType, setReportType] = useState('customerList');
    const [layoutType, setLayoutType] = useState('standardList');
    const [loading, setLoading] = useState(false);

    if (currentUser?.role !== 'Admin') {
        return <Navigate to="/dashboard" replace />;
    }
    
    const generatePdf = () => {
        setLoading(true);
        const doc = new jsPDF();
        const isArabic = language === 'ar';
        
        if (isArabic) {
            const amiriFontB64 = amiriFont.split(',')[1];
            doc.addFileToVFS('Amiri-Regular.ttf', amiriFontB64);
            doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
            doc.setFont('Amiri');
        }
        
        doc.text(`${t('companyName')} - ${t(reportType as any)}`, 14, 16);

        let head: string[][] = [];
        let body: any[][] = [];

        switch (reportType) {
            case 'customerList':
                head = [[t('customerName'), t('phone'), t('passportNumber'), t('passportExpiry')]];
                body = customers.map(c => [c.name, c.phone, c.passportNumber, c.passportExpiry]);
                break;
            case 'bookingList':
                head = [[t('bookingId'), t('customer'), t('package'), t('status'), t('totalPaid')]];
                body = bookings.map(b => {
                    const customer = customers.find(c => c.id === b.customerId)?.name || 'N/A';
                    const pkg = packages.find(p => p.id === b.packageId)?.name || 'N/A';
                    return [b.id, customer, pkg, b.status, `EGP ${b.totalPaid.toLocaleString()}`];
                });
                break;
            case 'financialSummary':
                 const totalIncome = payments.reduce((sum, p) => sum + p.amount, 0);
                 const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
                 head = [['Category', 'Amount']];
                 body = [
                     [t('income'), `EGP ${totalIncome.toLocaleString()}`],
                     [t('expenses'), `EGP ${totalExpenses.toLocaleString()}`],
                     [t('profit'), `EGP ${(totalIncome - totalExpenses).toLocaleString()}`]
                 ];
                 break;
        }

        const autoTableStyles: any = {};
        if (isArabic) {
            autoTableStyles.styles = { font: 'Amiri', halign: 'right' };
            autoTableStyles.headStyles = { font: 'Amiri', halign: 'right' };
        }

        autoTable(doc, {
            ...autoTableStyles,
            head: head,
            body: body,
            startY: 22,
        });
        
        doc.save(`${reportType}.pdf`);
        setLoading(false);
    };

    const generateExcel = () => {
        setLoading(true);
        const workbook = XLSX.utils.book_new();

        if (reportType === 'hotelRoomingList') {
            const confirmedBookings = bookings.filter(b => b.status === 'Confirmed');

            const hotelData: Record<string, any[]> = {};

            confirmedBookings.forEach(booking => {
                const customer = customers.find(c => c.id === booking.customerId);
                const pkg = packages.find(p => p.id === booking.packageId);
                if (!customer || !pkg) return;

                const guestInfo = { 
                    customerName: customer.name, 
                    roomType: booking.roomType, 
                    meals: booking.meals,
                    gender: customer.gender,
                    age: customer.age,
                    withoutBed: booking.withoutBed,
                };

                if (pkg.hotelMakkah) {
                    if (!hotelData[pkg.hotelMakkah]) hotelData[pkg.hotelMakkah] = [];
                    hotelData[pkg.hotelMakkah].push(guestInfo);
                }
                if (pkg.hotelMadinah) {
                    if (!hotelData[pkg.hotelMadinah]) hotelData[pkg.hotelMadinah] = [];
                    hotelData[pkg.hotelMadinah].push(guestInfo);
                }
            });

            for (const hotelName in hotelData) {
                let sheetData: any[] = [];
                if (layoutType === 'roomLayout') {
                    const guestsWithBeds = hotelData[hotelName].filter(g => !g.withoutBed);
                    const guestsWithoutBeds = hotelData[hotelName].filter(g => g.withoutBed);

                    const roomCounters: Record<string, number> = { 'Double': 0, 'Triple': 0, 'Quad': 0, 'Quintuple': 0 };
                    const roomCapacity = { 'Double': 2, 'Triple': 3, 'Quad': 4, 'Quintuple': 5 };

                    const guestsByRoomType: Record<string, any[]> = {};
                    guestsWithBeds.forEach(guest => {
                        const type = guest.roomType || 'Double';
                        if (!guestsByRoomType[type]) guestsByRoomType[type] = [];
                        guestsByRoomType[type].push(guest);
                    });

                    Object.entries(guestsByRoomType).forEach(([roomType, guests]) => {
                        const capacity = roomCapacity[roomType as keyof typeof roomCapacity] || 2;
                        for (let i = 0; i < guests.length; i += capacity) {
                            roomCounters[roomType as keyof typeof roomCounters]++;
                            const roomGuests = guests.slice(i, i + capacity);
                            const guestsString = roomGuests
                                .map(guest => `${guest.customerName} (${t(guest.gender)}, ${guest.age})`)
                                .join('\n');

                            const row = {
                                [t('roomType')]: roomType,
                                'Room #': roomCounters[roomType as keyof typeof roomCounters],
                                [t('meals')]: roomGuests[0]?.meals ? t(roomGuests[0].meals.replace(' ', '') as any) : 'N/A',
                                [t('guests')]: guestsString,
                            };
                            sheetData.push(row);
                        }
                    });

                    if (guestsWithoutBeds.length > 0) {
                        sheetData.push({}); // Spacer row
                        const guestsString = guestsWithoutBeds
                            .map(guest => `${guest.customerName} (${t(guest.gender)}, ${guest.age})`)
                            .join('\n');
                        sheetData.push({
                            [t('roomType')]: t('withoutBed').toUpperCase(),
                             'Room #': '',
                             [t('meals')]: '',
                             [t('guests')]: guestsString
                        });
                    }

                } else { // Standard List
                    sheetData = hotelData[hotelName].map(d => ({
                        [t('customerName')]: d.customerName,
                        [t('gender')]: t(d.gender),
                        [t('age')]: d.age,
                        [t('roomType')]: d.withoutBed ? t('withoutBedShort') : d.roomType,
                        [t('meals')]: d.withoutBed ? 'N/A' : (d.meals ? t(d.meals.replace(' ', '') as any) : 'N/A'),
                    }));
                }
                
                const worksheet = XLSX.utils.json_to_sheet(sheetData);
                const cols = Object.keys(sheetData[0] || {}).map(key => ({ wch: key === t('guests') ? 50 : Math.max(20, key.length + 2) }));
                worksheet['!cols'] = cols;
                
                // Enable text wrapping for the "Guests" column
                const guestColumnIndex = Object.keys(sheetData[0] || {}).findIndex(key => key === t('guests'));
                if (guestColumnIndex !== -1 && layoutType === 'roomLayout') {
                    const guestCol = XLSX.utils.encode_col(guestColumnIndex);
                    for(let i = 1; i <= sheetData.length + 1; i++) {
                        const cellAddress = `${guestCol}${i}`;
                        if(worksheet[cellAddress]) {
                            if(!worksheet[cellAddress].s) worksheet[cellAddress].s = {};
                            worksheet[cellAddress].s.alignment = { wrapText: true, vertical: 'top' };
                        }
                    }
                }

                XLSX.utils.book_append_sheet(workbook, worksheet, hotelName.substring(0, 31));
            }
        
        } else {
             let data: any[] = [];
             let sheetName = 'Report';
             switch (reportType) {
                case 'customerList':
                    data = customers.map(c => ({ [t('customerName')]: c.name, [t('phone')]: c.phone, [t('passportNumber')]: c.passportNumber }));
                    sheetName = t('customerList');
                    break;
                case 'bookingList':
                    data = bookings.map(b => {
                        const customer = customers.find(c => c.id === b.customerId)?.name || 'N/A';
                        const pkg = packages.find(p => p.id === b.packageId)?.name || 'N/A';
                        return { [t('bookingId')]: b.id, [t('customer')]: customer, [t('package')]: pkg, [t('status')]: b.status, [t('totalPaid')]: b.totalPaid };
                    });
                    sheetName = t('bookingList');
                    break;
                case 'financialSummary':
                    const totalIncome = payments.reduce((sum, p) => sum + p.amount, 0);
                    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
                    data = [
                        { 'Category': t('income'), 'Amount': totalIncome },
                        { 'Category': t('expenses'), 'Amount': totalExpenses },
                        { 'Category': t('profit'), 'Amount': totalIncome - totalExpenses },
                    ];
                    sheetName = t('financialSummary');
                    break;
            }
            const worksheet = XLSX.utils.json_to_sheet(data);
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        }
        
        XLSX.writeFile(workbook, `${reportType}.xlsx`);
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">{t('generateReports')}</h1>

            <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-md space-y-6">
                <div>
                    <label htmlFor="reportType" className="block text-sm font-medium text-gray-500 mb-2">{t('reportType')}</label>
                    <select
                        id="reportType"
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition-all duration-200"
                    >
                        <option value="customerList">{t('customerList')}</option>
                        <option value="bookingList">{t('bookingList')}</option>
                        <option value="financialSummary">{t('financialSummary')}</option>
                        <option value="hotelRoomingList">{t('hotelRoomingList')}</option>
                    </select>
                </div>

                {reportType === 'hotelRoomingList' && (
                    <div>
                        <label htmlFor="layoutType" className="block text-sm font-medium text-gray-500 mb-2">{t('reportLayout')}</label>
                        <select
                            id="layoutType"
                            value={layoutType}
                            onChange={(e) => setLayoutType(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition-all duration-200"
                        >
                            <option value="standardList">{t('standardList')}</option>
                            <option value="roomLayout">{t('roomLayout')} </option>
                        </select>
                    </div>
                )}

                <div className="flex gap-4">
                    <button
                        onClick={generatePdf}
                        disabled={loading || reportType === 'hotelRoomingList'}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-300 disabled:cursor-not-allowed"
                    >
                        <FileText className="w-5 h-5" />
                        <span>{loading ? t('loading') : t('generatePDF')}</span>
                    </button>
                    <button
                        onClick={generateExcel}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-300"
                    >
                        <FileSpreadsheet className="w-5 h-5" />
                        <span>{loading ? t('loading') : t('generateExcel')}</span>
                    </button>
                </div>
                <p className="text-xs text-center text-gray-500">Note: PDF generation has limited support for Arabic text without font embedding.</p>
            </div>
        </div>
    );
};

export default Reports;