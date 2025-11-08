import React from 'react';
import Modal from './Modal';
import { useApp } from '../hooks/useApp';
import type { Booking, Customer, Package, Payment } from '../types';
import { User, Package as PackageIcon, Ticket, Plane, BedDouble, Utensils, Hash, Phone, Mail, BadgePercent, Wallet, Landmark } from 'lucide-react';

interface BookingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  customer?: Customer;
  pkg?: Package;
  bookingPayments: Payment[];
}

const DetailRow: React.FC<{ label: string, value?: string | number | null, icon?: React.ElementType }> = ({ label, value, icon: Icon }) => (
    <div className="flex items-start text-sm">
        {Icon && <Icon className="w-4 h-4 text-gray-400 mt-0.5 me-3 flex-shrink-0" />}
        <span className="font-semibold text-gray-600 w-32">{label}:</span>
        <span className="text-gray-800 break-words">{value || 'N/A'}</span>
    </div>
);

const Section: React.FC<{ title: string, icon: React.ElementType, children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
    <div>
        <h4 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-2 flex items-center gap-2">
            <Icon className="w-5 h-5 text-primary" />
            {title}
        </h4>
        <div className="space-y-2">{children}</div>
    </div>
);

const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({ isOpen, onClose, booking, customer, pkg, bookingPayments }) => {
    const { t } = useApp();

    if (!booking) return null;

    const totalPaid = bookingPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalPrice = booking.isTicketOnly ? booking.ticketTotalPaid ?? 0 : pkg?.price ?? 0;
    const remainingBalance = totalPrice - totalPaid;
    const ticketProfit = (booking.ticketTotalPaid ?? 0) - (booking.ticketCostPrice ?? 0);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${t('bookingDetails')} - ${booking.id}`}>
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pe-4">
                {/* Customer Information */}
                {customer && (
                    <Section title={t('customerInformation')} icon={User}>
                        <DetailRow label={t('customerName')} value={customer.name} />
                        <DetailRow label={t('phone')} value={customer.phone} icon={Phone}/>
                        <DetailRow label={t('email')} value={customer.email} icon={Mail} />
                        <DetailRow label={t('passportNumber')} value={customer.passportNumber} icon={Hash} />
                    </Section>
                )}

                {/* Package/Ticket Information */}
                {booking.isTicketOnly ? (
                    <Section title={t('ticketInformation')} icon={Ticket}>
                         <DetailRow label={t('ticketCostPrice')} value={`${t('price_unit', { price: (booking.ticketCostPrice || 0).toLocaleString()})}`} />
                         <DetailRow label={t('ticketTotalPaid')} value={`${t('price_unit', { price: (booking.ticketTotalPaid || 0).toLocaleString()})}`} />
                         <DetailRow label={t('profit')} value={`${t('price_unit', { price: ticketProfit.toLocaleString()})}`} />
                    </Section>
                ) : pkg && (
                     <Section title={t('packageInformation')} icon={PackageIcon}>
                        <DetailRow label={t('packageName')} value={pkg.name} />
                        <DetailRow label={t('packageCode')} value={pkg.packageCode} />
                        <DetailRow label={t('price')} value={`${t('price_unit', { price: pkg.price.toLocaleString()})}`} />
                        <DetailRow label={t('duration')} value={`${pkg.duration} ${t('days_unit')}`} />
                        <DetailRow label={t('hotelMakkah')} value={pkg.hotelMakkah} />
                        <DetailRow label={t('hotelMadinah')} value={pkg.hotelMadinah} />
                     </Section>
                )}

                {/* Flight Details */}
                {booking.flightDetails && (
                    <Section title={t('flightInformation')} icon={Plane}>
                        <DetailRow label={t('airline')} value={`${booking.flightDetails.airline} - ${booking.flightDetails.flightNumber}`} />
                        <DetailRow label={t('departureDate')} value={new Date(booking.flightDetails.departureDate).toLocaleDateString()} />
                        <DetailRow label={t('returnDate')} value={new Date(booking.flightDetails.returnDate).toLocaleDateString()} />
                    </Section>
                )}

                {/* Room & Meal Details */}
                {!booking.isTicketOnly && (
                     <Section title={t('roomAndMealInformation')} icon={BedDouble}>
                        {booking.withoutBed ? (
                            <DetailRow label={t('roomType')} value={t('withoutBedShort')} />
                        ) : (
                            <>
                                <DetailRow label={t('roomType')} value={booking.roomType} />
                                <DetailRow label={t('meals')} value={booking.meals ? t(booking.meals.replace(' ', '') as any) : 'N/A'} icon={Utensils} />
                            </>
                        )}
                     </Section>
                )}
                
                {/* Financial Summary */}
                <Section title={t('financialSummary')} icon={BadgePercent}>
                    <DetailRow label={t('totalPackagePrice')} value={`${t('price_unit', { price: totalPrice.toLocaleString()})}`} />
                    <DetailRow label={t('amountPaid')} value={`${t('price_unit', { price: totalPaid.toLocaleString()})}`} />
                    <DetailRow label={t('remainingBalance')} value={`${t('price_unit', { price: remainingBalance.toLocaleString()})}`} />
                </Section>
                
                {/* Payment History */}
                <Section title={t('paymentHistory')} icon={Wallet}>
                     {bookingPayments.length > 0 ? (
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-start font-semibold text-gray-600">{t('paymentDate')}</th>
                                        <th className="px-4 py-2 text-start font-semibold text-gray-600">{t('amount')}</th>
                                        <th className="px-4 py-2 text-start font-semibold text-gray-600">{t('paymentMethod')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {bookingPayments.map(p => (
                                        <tr key={p.id}>
                                            <td className="px-4 py-2">{new Date(p.paymentDate).toLocaleDateString()}</td>
                                            <td className="px-4 py-2">{t('price_unit', { price: p.amount.toLocaleString()})}</td>
                                            <td className="px-4 py-2">{t(p.method.replace(' ', '') as any)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 italic">{t('noPaymentsMade')}</p>
                    )}
                </Section>

            </div>
            <div className="flex justify-end pt-4 mt-4 border-t">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">{t('close')}</button>
            </div>
        </Modal>
    );
};

export default BookingDetailsModal;
