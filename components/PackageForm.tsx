import React, { useState, useEffect } from 'react';
import { useApp } from '../hooks/useApp';
import type { Package } from '../types';

interface PackageFormProps {
  onSave: (pkg: Omit<Package, 'id'> & { id?: string }) => void;
  onCancel: () => void;
  pkg?: Package | null;
}

const PackageForm: React.FC<PackageFormProps> = ({ onSave, onCancel, pkg }) => {
    const { t } = useApp();
    const [packageCode, setPackageCode] = useState('');
    const [name, setName] = useState('');
    const [type, setType] = useState<'Hajj' | 'Umrah'>('Umrah');
    const [duration, setDuration] = useState(0);
    const [price, setPrice] = useState(0);
    const [description, setDescription] = useState('');
    const [hotelMakkah, setHotelMakkah] = useState('');
    const [hotelMadinah, setHotelMadinah] = useState('');
    const [includes, setIncludes] = useState('');
    const [isFeatured, setIsFeatured] = useState(false);

    useEffect(() => {
        if (pkg) {
            setPackageCode(pkg.packageCode);
            setName(pkg.name);
            setType(pkg.type);
            setDuration(pkg.duration);
            setPrice(pkg.price);
            setDescription(pkg.description);
            setHotelMakkah(pkg.hotelMakkah);
            setHotelMadinah(pkg.hotelMadinah);
            setIncludes(pkg.includes.join(', '));
            setIsFeatured(pkg.isFeatured);
        } else {
            setPackageCode('');
            setName('');
            setType('Umrah');
            setDuration(0);
            setPrice(0);
            setDescription('');
            setHotelMakkah('');
            setHotelMadinah('');
            setIncludes('');
            setIsFeatured(false);
        }
    }, [pkg]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            id: pkg?.id,
            packageCode,
            name,
            type,
            duration,
            price,
            description,
            hotelMakkah,
            hotelMadinah,
            includes: includes.split(',').map(item => item.trim()).filter(Boolean),
            isFeatured,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="packageCode" className="block text-sm font-medium text-gray-500">{t('packageCode')}</label>
                    <input type="text" id="packageCode" value={packageCode} onChange={e => setPackageCode(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200" required />
                </div>
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-500">{t('packageName')}</label>
                    <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200" required />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-500">{t('packageType')}</label>
                    <select id="type" value={type} onChange={e => setType(e.target.value as any)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200">
                        <option value="Umrah">Umrah</option>
                        <option value="Hajj">Hajj</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="duration" className="block text-sm font-medium text-gray-500">{t('duration')}</label>
                    <input type="number" id="duration" value={duration} onChange={e => setDuration(Number(e.target.value))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200" required />
                </div>
                <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-500">{t('price')}</label>
                    <input type="number" id="price" value={price} onChange={e => setPrice(Number(e.target.value))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200" required />
                </div>
            </div>
             <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-500">{t('description')}</label>
                <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200" />
            </div>
            
            <fieldset className="border-t pt-4">
                <legend className="text-sm font-medium text-gray-500 px-2 -mx-2">{t('hotelDetails')}</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div>
                        <label htmlFor="hotelMakkah" className="block text-sm font-medium text-gray-500">{t('hotelMakkah')}</label>
                        <input type="text" id="hotelMakkah" value={hotelMakkah} onChange={e => setHotelMakkah(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200" />
                    </div>
                     <div>
                        <label htmlFor="hotelMadinah" className="block text-sm font-medium text-gray-500">{t('hotelMadinah')}</label>
                        <input type="text" id="hotelMadinah" value={hotelMadinah} onChange={e => setHotelMadinah(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200" />
                    </div>
                </div>
            </fieldset>

            <div>
                <label htmlFor="includes" className="block text-sm font-medium text-gray-500">{t('includes')}</label>
                <input type="text" id="includes" value={includes} placeholder={t('includesHint')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200" />
            </div>

            <div className="pt-2">
                <label className="flex items-center space-x-2 rtl:space-x-reverse cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={isFeatured}
                        onChange={e => setIsFeatured(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-gray-500">{t('isFeatured')}</span>
                </label>
            </div>
            
            <div className="flex justify-end gap-4 pt-4 border-t mt-6">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors">{t('cancel')}</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors">{t('save')}</button>
            </div>
        </form>
    );
};

export default PackageForm;
