
import React, { useState, useMemo } from 'react';
import { useApp } from '../hooks/useApp';
import { PlusCircle, Edit, Trash2, Search, X, Star, Package as PackageIcon } from 'lucide-react';
import Modal from '../components/Modal';
import PackageForm from '../components/PackageForm';
import ConfirmationModal from '../components/ConfirmationModal';
import EmptyState from '../components/EmptyState';
import type { Package } from '../types';

const Packages: React.FC = () => {
    const { t, packages, setPackages, addToast, currentUser, logActivity } = useApp();
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState<Package | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingPackageId, setDeletingPackageId] = useState<string | null>(null);

    // State for filters
    const [searchTerm, setSearchTerm] = useState('');
    const [packageTypeFilter, setPackageTypeFilter] = useState('All');

    const filteredPackages = useMemo(() => {
        // Sort featured packages to the top
        const sorted = [...packages].sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));

        return sorted.filter(pkg => {
            const searchTermMatch = searchTerm === '' ||
                pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                pkg.packageCode.toLowerCase().includes(searchTerm.toLowerCase());

            const typeMatch = packageTypeFilter === 'All' || pkg.type === packageTypeFilter;

            return searchTermMatch && typeMatch;
        });
    }, [packages, searchTerm, packageTypeFilter]);
    
    const resetFilters = () => {
        setSearchTerm('');
        setPackageTypeFilter('All');
    }

    const handleSavePackage = (packageData: Omit<Package, 'id'> & { id?: string }) => {
        if (packageData.id) {
            // Edit mode
            setPackages(prev => prev.map(p =>
                p.id === packageData.id ? { ...p, ...packageData, id: p.id } as Package : p
            ));
            logActivity('Updated', 'Package', packageData.id, packageData.name);
        } else {
            // Add mode
            const newPackage: Package = {
                id: `P${Date.now()}`,
                ...packageData,
            } as Package;
            setPackages(prev => [newPackage, ...prev]);
            logActivity('Created', 'Package', newPackage.id, newPackage.name);
        }
        setIsFormModalOpen(false);
        setEditingPackage(null);
        addToast({
            title: t('success'),
            message: t('packageSavedSuccess'),
            type: 'success'
        });
    };
    
    const handleDeletePackage = (packageId: string) => {
        setDeletingPackageId(packageId);
        setIsDeleteModalOpen(true);
    };

    const confirmDeletePackage = () => {
        if (!deletingPackageId) return;
        const pkgToDelete = packages.find(p => p.id === deletingPackageId);
        if(pkgToDelete){
            setPackages(prev => prev.filter(p => p.id !== deletingPackageId));
            addToast({
                title: t('success'),
                message: t('packageDeletedSuccess'),
                type: 'success',
            });
            logActivity('Deleted', 'Package', deletingPackageId, pkgToDelete.name);
        }
        setDeletingPackageId(null);
        setIsDeleteModalOpen(false);
    };

    const handleOpenEditModal = (pkg: Package) => {
        setEditingPackage(pkg);
        setIsFormModalOpen(true);
    };

    const handleOpenAddModal = () => {
        setEditingPackage(null);
        setIsFormModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsFormModalOpen(false);
        setEditingPackage(null);
    };


    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-800">{t('packages')}</h1>
                <button 
                    onClick={handleOpenAddModal}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                    <PlusCircle className="w-5 h-5" />
                    <span>{t('addPackage')}</span>
                </button>
            </div>
            
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl shadow-md flex flex-col sm:flex-row flex-wrap items-center gap-4">
                <div className="relative flex-grow w-full sm:w-auto">
                    <Search className="absolute left-3 rtl:right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder={t('searchPackages')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 rtl:pr-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition-all duration-200"
                    />
                </div>
                <div className="w-full sm:w-48">
                    <label htmlFor="packageType" className="sr-only">{t('packageType')}</label>
                    <select id="packageType" value={packageTypeFilter} onChange={e => setPackageTypeFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition-all duration-200">
                        <option value="All">{t('all')} {t('packageType')}</option>
                        <option value="Hajj">Hajj</option>
                        <option value="Umrah">Umrah</option>
                    </select>
                </div>
                <button onClick={resetFilters} className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                    <X className="w-4 h-4" />
                    <span>{t('resetFilters')}</span>
                </button>
            </div>
            
            {filteredPackages.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPackages.map(pkg => (
                        <div key={pkg.id} className={`bg-white rounded-xl shadow-md p-6 flex flex-col justify-between relative overflow-hidden transition-all ${pkg.isFeatured ? 'border-2 border-secondary' : 'border border-transparent'}`}>
                            {pkg.isFeatured && (
                                <div className="absolute top-0 right-0 rtl:left-0 rtl:right-auto p-2 bg-secondary rounded-bl-xl rtl:rounded-br-xl rtl:rounded-bl-none">
                                    <Star className="w-5 h-5 text-white fill-current" />
                                </div>
                            )}
                            <div>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800 pr-8 rtl:pl-8">{pkg.name}</h2>
                                        <p className="text-xs font-mono text-gray-400 mt-1">{pkg.packageCode}</p>
                                    </div>
                                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${pkg.type === 'Hajj' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                        {pkg.type}
                                    </span>
                                </div>
                                <p className="text-2xl font-bold text-primary my-3">EGP {pkg.price.toLocaleString()}</p>
                                <p className="text-sm text-gray-500 mb-4">{pkg.description}</p>
                                <div className="text-sm space-y-2">
                                    <p><span className="font-semibold">{t('duration')}:</span> {pkg.duration} days</p>
                                    <p><span className="font-semibold">{t('hotelMakkah')}:</span> {pkg.hotelMakkah}</p>
                                    <p><span className="font-semibold">{t('hotelMadinah')}:</span> {pkg.hotelMadinah}</p>
                                    <p><span className="font-semibold">{t('includes')}:</span> {pkg.includes.join(', ')}</p>
                                </div>
                            </div>
                            <div className="flex justify-end items-center gap-4 mt-6">
                                <button onClick={() => handleOpenEditModal(pkg)} className="text-blue-600 hover:text-blue-800" title={t('edit')}>
                                    <Edit className="w-5 h-5" />
                                </button>
                                {currentUser?.role === 'Admin' && (
                                    <button onClick={() => handleDeletePackage(pkg.id)} className="text-accent hover:text-red-800" title={t('delete')}>
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon={PackageIcon}
                    title={searchTerm || packageTypeFilter !== 'All' ? t('noPackagesFound') : t('packages')}
                    message={t('noPackagesFoundSub')}
                    actionText={packages.length === 0 ? t('addNewPackageCTA') : t('resetFilters')}
                    onAction={packages.length === 0 ? handleOpenAddModal : resetFilters}
                />
            )}
            
            <Modal
                isOpen={isFormModalOpen}
                onClose={handleCloseModal}
                title={editingPackage ? t('editPackage') : t('addPackage')}
            >
                <PackageForm
                    onSave={handleSavePackage}
                    onCancel={handleCloseModal}
                    pkg={editingPackage}
                />
            </Modal>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDeletePackage}
                title={t('confirmDeletionTitle')}
                message={t('confirmDeletePackage')}
            />
        </div>
    );
};

export default Packages;
