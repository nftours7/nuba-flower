

import React, { useState, useMemo } from 'react';
import { useApp } from '../hooks/useApp';
import { PlusCircle, Edit, Trash2, Search, FileText, X, Users, Download } from 'lucide-react';
import Modal from '../components/Modal';
import CustomerForm from '../components/CustomerForm';
import DocumentsModal from '../components/DocumentsModal';
import ConfirmationModal from '../components/ConfirmationModal';
import EmptyState from '../components/EmptyState';
import type { Customer, DocumentFile } from '../types';

const Customers: React.FC = () => {
    const { t, customers, setCustomers, addToast, currentUser, logActivity } = useApp();
    
    // State for modals
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(null);

    const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

    // State for filters
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const filteredCustomers = useMemo(() => {
        return customers.filter(c => {
            const searchTermMatch = searchTerm === '' ||
                c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.phone.includes(searchTerm) ||
                c.passportNumber.toLowerCase().includes(searchTerm.toLowerCase());

            const startDateMatch = startDate === '' || new Date(c.dateAdded) >= new Date(startDate);
            const endDateMatch = endDate === '' || new Date(c.dateAdded) <= new Date(endDate);

            return searchTermMatch && startDateMatch && endDateMatch;
        });
    }, [customers, searchTerm, startDate, endDate]);

    const resetFilters = () => {
        setSearchTerm('');
        setStartDate('');
        setEndDate('');
    };

    const handleSaveCustomer = (customerData: Omit<Customer, 'documents' | 'dateAdded' | 'id'> & { id?: string, scannedPassportFile?: { url: string, name: string, type: string } }) => {
        let savedCustomer: Customer | undefined;
        if (customerData.id) {
            // Edit mode
            setCustomers(prev => prev.map(c => 
                c.id === customerData.id 
                ? (savedCustomer = { ...c, ...customerData, id: c.id })
                : c
            ));
            logActivity('Updated', 'Customer', customerData.id, customerData.name);
        } else {
            // Add mode
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
            if(customerData.scannedPassportFile) {
                const passportDoc: DocumentFile = {
                    id: `DOC-${Date.now()}`,
                    name: `Scanned Passport - ${new Date().toLocaleDateString()}`,
                    type: 'passport',
                    url: customerData.scannedPassportFile.url
                };
                newCustomer.documents.push(passportDoc);
                logActivity('Created', 'Document', passportDoc.id, `{docName: '${passportDoc.name}', details: '${newCustomer.name}'}`);
            }
            savedCustomer = newCustomer;
            setCustomers(prev => [newCustomer, ...prev]);
            logActivity('Created', 'Customer', newCustomer.id, newCustomer.name);
        }
        setIsFormModalOpen(false);
        setEditingCustomer(null);
        addToast({
            title: t('success'),
            message: t('customerSavedSuccess'),
            type: 'success',
        });
    };
    
    const handleDeleteCustomer = (customerId: string) => {
        setDeletingCustomerId(customerId);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteCustomer = () => {
        if (!deletingCustomerId) return;
        const customerToDelete = customers.find(c => c.id === deletingCustomerId);
        if (customerToDelete) {
            setCustomers(prev => prev.filter(c => c.id !== deletingCustomerId));
            addToast({
                title: t('success'),
                message: t('customerDeletedSuccess'),
                type: 'success',
            });
            logActivity('Deleted', 'Customer', deletingCustomerId, customerToDelete.name);
        }
        setDeletingCustomerId(null);
        setIsDeleteModalOpen(false);
    };


    const handleOpenDocumentsModal = (customer: Customer) => {
        setActiveCustomer(customer);
        setIsDocumentsModalOpen(true);
    };
    
    const handleOpenEditModal = (customer: Customer) => {
        setEditingCustomer(customer);
        setIsFormModalOpen(true);
    };

    const handleOpenAddModal = () => {
        setEditingCustomer(null);
        setIsFormModalOpen(true);
    };

    const handleAddDocument = (customer: Customer, document: DocumentFile) => {
        setCustomers(prev => prev.map(c => 
            c.id === customer.id 
            ? { ...c, documents: [...c.documents, document] } 
            : c
        ));
        addToast({
            title: t('success'),
            message: t('documentAddedSuccess'),
            type: 'success'
        });
        logActivity('Created', 'Document', document.id, `{docName: '${document.name}', details: '${customer.name}'}`);
    };

    const handleDeleteDocument = (customer: Customer, documentId: string) => {
        const docToDelete = customer.documents.find(d => d.id === documentId);
        if (docToDelete) {
             setCustomers(prev => prev.map(c =>
                c.id === customer.id
                ? { ...c, documents: c.documents.filter(d => d.id !== documentId) }
                : c
            ));
            addToast({
                title: t('success'),
                message: t('documentDeletedSuccess'),
                type: 'success'
            });
            logActivity('Deleted', 'Document', documentId, `{docName: '${docToDelete.name}', details: '${customer.name}'}`);
        }
    };
    
    const handleCloseModal = () => {
        setIsFormModalOpen(false);
        setEditingCustomer(null);
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h1 className="text-3xl font-bold text-gray-800">{t('customers')}</h1>
                <button 
                    onClick={handleOpenAddModal}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors order-first md:order-last"
                >
                    <PlusCircle className="w-5 h-5" />
                    <span>{t('addCustomer')}</span>
                </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl shadow-md flex flex-col sm:flex-row flex-wrap items-center gap-4">
                <div className="relative flex-grow w-full sm:w-auto">
                    <Search className="absolute left-3 rtl:right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder={t('searchCustomers')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 rtl:pr-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition-all duration-200"
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <label htmlFor="startDate" className="text-sm font-medium text-gray-500 whitespace-nowrap">{t('dateAddedRange')}:</label>
                    <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition-all duration-200" />
                    <span className="text-gray-500">-</span>
                    <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition-all duration-200" />
                </div>
                <button onClick={resetFilters} className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                    <X className="w-4 h-4" />
                    <span>{t('resetFilters')}</span>
                </button>
            </div>
            
            {filteredCustomers.length > 0 ? (
                <div className="bg-white p-4 rounded-xl shadow-md overflow-x-auto">
                    <table className="w-full text-sm text-left rtl:text-right text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t('customerName')}</th>
                                <th scope="col" className="px-6 py-3">{t('phone')}</th>
                                <th scope="col" className="px-6 py-3">{t('passportNumber')}</th>
                                <th scope="col" className="px-6 py-3">{t('passportExpiry')}</th>
                                <th scope="col" className="px-6 py-3 text-center">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.map(customer => (
                                <tr key={customer.id} className="bg-white border-b hover:bg-gray-50 transition-colors duration-150">
                                    <td className="px-6 py-4 font-medium text-gray-900">{customer.name}</td>
                                    <td className="px-6 py-4">{customer.phone}</td>
                                    <td className="px-6 py-4">{customer.passportNumber}</td>
                                    <td className="px-6 py-4">{customer.passportExpiry}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center items-center gap-4">
                                            <button onClick={() => handleOpenDocumentsModal(customer)} className="text-gray-500 hover:text-gray-800" title={t('documents')}>
                                                <FileText className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleOpenEditModal(customer)} className="text-blue-600 hover:text-blue-800" title={t('edit')}><Edit className="w-5 h-5" /></button>
                                            {currentUser?.role === 'Admin' && (
                                                <button onClick={() => handleDeleteCustomer(customer.id)} className="text-accent hover:text-red-800" title={t('delete')}><Trash2 className="w-5 h-5" /></button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <EmptyState
                    icon={Users}
                    title={searchTerm || startDate || endDate ? t('noCustomersFound') : t('customers')}
                    message={searchTerm || startDate || endDate ? t('noCustomersFoundSub') : t('noCustomersFoundSub')}
                    actionText={customers.length === 0 ? t('addNewCustomerCTA') : t('resetFilters')}
                    onAction={customers.length === 0 ? handleOpenAddModal : resetFilters}
                />
            )}


            {isFormModalOpen && (
                 <Modal
                    isOpen={isFormModalOpen}
                    onClose={handleCloseModal}
                    title={editingCustomer ? t('editCustomer') : t('addCustomer')}
                >
                    <CustomerForm
                        onSave={handleSaveCustomer}
                        onCancel={handleCloseModal}
                        customer={editingCustomer}
                    />
                </Modal>
            )}

            {isDocumentsModalOpen && activeCustomer && (
                <DocumentsModal
                    isOpen={isDocumentsModalOpen}
                    onClose={() => setIsDocumentsModalOpen(false)}
                    customer={activeCustomer}
                    onAddDocument={handleAddDocument}
                    onDeleteDocument={handleDeleteDocument}
                />
            )}
            
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDeleteCustomer}
                title={t('confirmDeletionTitle')}
                message={t('confirmDeleteCustomer')}
            />
        </div>
    );
};

export default Customers;