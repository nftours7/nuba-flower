import React, { useState, useEffect } from 'react';
import { useApp } from '../hooks/useApp';
import type { Customer } from '../types';
import { UploadCloud, LoaderCircle, CheckCircle2, XCircle } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

interface CustomerFormProps {
  onSave: (customer: Omit<Customer, 'documents' | 'dateAdded' | 'id'> & { id?: string, scannedPassportFile?: { url: string, name: string, type: string } }) => void;
  onCancel: () => void;
  customer?: Customer | null; // Optional for editing
  flightDepartureDate?: string; // Optional for validation against a specific flight
}

type ScanState = 'idle' | 'scanning' | 'success' | 'error';

const CustomerForm: React.FC<CustomerFormProps> = ({ onSave, onCancel, customer, flightDepartureDate }) => {
    const { t, addToast, bookings } = useApp();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [passportNumber, setPassportNumber] = useState('');
    const [passportExpiry, setPassportExpiry] = useState('');
    const [age, setAge] = useState<number>(0);
    const [gender, setGender] = useState<'Male' | 'Female'>('Male');
    
    const [scanState, setScanState] = useState<ScanState>('idle');
    const [scanError, setScanError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [scannedPassportFile, setScannedPassportFile] = useState<{ url: string, name: string, type: string } | null>(null);

    const isAdding = !customer;

    useEffect(() => {
        if (customer) {
            setName(customer.name);
            setPhone(customer.phone);
            setEmail(customer.email);
            setPassportNumber(customer.passportNumber);
            setPassportExpiry(customer.passportExpiry);
            setAge(customer.age || 0);
            setGender(customer.gender || 'Male');
        } else {
            // Reset form for "Add New"
            setName('');
            setPhone('');
            setEmail('');
            setPassportNumber('');
            setPassportExpiry('');
            setAge(0);
            setGender('Male');
        }
        setScanState('idle');
        setScanError(null);
        setFileName(null);
        setScannedPassportFile(null);
    }, [customer]);

    const calculateAge = (dobString: string): number => {
        // This function calculates the current age based on a date of birth string.
        const dob = new Date(dobString);
        if (isNaN(dob.getTime())) return 0; // Return 0 for invalid dates
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDifference = today.getMonth() - dob.getMonth();
        if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < dob.getDate())) {
            age--;
        }
        return age > 0 ? age : 0;
    };


    const handlePassportScan = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setScanState('scanning');
        setScanError(null);

        try {
            if (!process.env.API_KEY) {
                setScanError(t('apiKeyNotConfiguredError'));
                setScanState('error');
                return;
            }
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const fileToGenerativePart = (file: File) => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve({
                        inlineData: {
                            data: (reader.result as string).split(',')[1],
                            mimeType: file.type
                        }
                    });
                    reader.onerror = (err) => reject(err);
                    reader.readAsDataURL(file);
                });
            };

            const imagePart = await fileToGenerativePart(file);

            const schema = {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: 'Full name of the person as written in the passport.' },
                    passportNumber: { type: Type.STRING, description: 'The passport number.' },
                    passportExpiry: { type: Type.STRING, description: 'The passport expiry date in YYYY-MM-DD format.' },
                    dateOfBirth: { type: Type.STRING, description: 'The date of birth in YYYY-MM-DD format.' },
                    gender: { type: Type.STRING, description: 'The gender or sex of the person, either "Male" or "Female".' },
                },
                required: ['name', 'passportNumber', 'passportExpiry', 'dateOfBirth', 'gender']
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: {
                    parts: [
                        { text: "Analyze the provided passport image and extract the person's details." },
                        imagePart as any
                    ]
                },
                config: {
                    systemInstruction: "You are an expert OCR system specializing in extracting information from official documents like passports. You must only return data in the specified JSON format. The gender should be one of 'Male' or 'Female'.",
                    responseMimeType: "application/json",
                    responseSchema: schema
                }
            });
            
            const responseText = response.text;
            if (!responseText) {
                throw new Error("Model returned an empty response. This can be caused by safety filters or an unreadable file.");
            }

            let result;
            try {
                result = JSON.parse(responseText);
            } catch (e) {
                console.error("Raw non-JSON response from model:", responseText);
                throw new Error("Model did not return valid JSON. Could not parse the response.");
            }
            
            if (result.name) setName(result.name);
            if (result.passportNumber) setPassportNumber(result.passportNumber.replace(/\s/g, ''));
            if (result.passportExpiry) setPassportExpiry(result.passportExpiry);
            
            // Extract Date of Birth and calculate the age
            if (result.dateOfBirth) {
                const calculatedAge = calculateAge(result.dateOfBirth);
                setAge(calculatedAge);
            }

            // Extract Gender
            if (result.gender && (result.gender === 'Male' || result.gender === 'Female')) {
                setGender(result.gender);
            }
            
            const objectUrl = URL.createObjectURL(file);
            setScannedPassportFile({ url: objectUrl, name: file.name, type: file.type });
            
            setScanState('success');
            setTimeout(() => setScanState('idle'), 2500);

        } catch (error) {
            console.error("Error scanning passport:", error);
            setScanError(t('scanError'));
            setScanState('error');
        } finally {
            event.target.value = ''; // Reset file input
        }
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !phone || !passportNumber || !passportExpiry || age <= 0) {
            addToast({
                title: t('error'),
                message: t('fillRequiredFieldsWarning'),
                type: 'error',
            });
            return;
        }

        let referenceDate: Date | null = null;
        let warningMessageKey: 'passportExpiryWarning' | 'passportSoonToExpireWarning' = 'passportSoonToExpireWarning';

        if (flightDepartureDate) {
            referenceDate = new Date(flightDepartureDate);
            warningMessageKey = 'passportExpiryWarning';
        } else if (customer) { // If editing an existing customer
            const customerBookings = bookings.filter(b => b.customerId === customer.id);
            const upcomingFlights = customerBookings
                .map(b => b.flightDetails?.departureDate ? new Date(b.flightDetails.departureDate) : null)
                .filter((d): d is Date => d !== null && d > new Date());

            if (upcomingFlights.length > 0) {
                // Use the earliest upcoming departure date for validation
                referenceDate = new Date(Math.min(...upcomingFlights.map(d => d.getTime())));
                warningMessageKey = 'passportExpiryWarning';
            }
        }

        // If no referenceDate from flights (or it's a new customer), use today as the reference.
        if (!referenceDate) {
            referenceDate = new Date();
        }

        const minExpiryDate = new Date(referenceDate);
        minExpiryDate.setMonth(minExpiryDate.getMonth() + 6);
        const expiryDate = new Date(passportExpiry);

        if (expiryDate < minExpiryDate) {
            addToast({
                title: t('error'),
                message: t(warningMessageKey),
                type: 'error',
            });
            return;
        }
        
        onSave({
            id: customer?.id,
            name,
            phone,
            email,
            passportNumber,
            passportExpiry,
            age,
            gender,
            scannedPassportFile: scannedPassportFile || undefined,
        });
    };
    
    const getScannerClasses = () => {
        const baseClasses = "relative block p-4 border-2 rounded-lg text-center transition-all duration-300 overflow-hidden";
        switch (scanState) {
            case 'scanning':
                return `${baseClasses} cursor-not-allowed bg-gray-100 border-solid border-primary/50 animate-pulse`;
            case 'success':
                return `${baseClasses} bg-green-50 border-solid border-green-500`;
            case 'error':
                return `${baseClasses} bg-red-50 border-solid border-red-500 cursor-pointer hover:border-red-600`;
            case 'idle':
            default:
                return `${baseClasses} border-dashed cursor-pointer hover:border-primary hover:bg-primary/5`;
        }
    };
    
    const renderScannerContent = () => {
        const contentHeight = "h-[80px]";
        switch (scanState) {
            case 'scanning':
                return (
                    <div className={`flex flex-col items-center justify-center ${contentHeight}`}>
                        <LoaderCircle className="w-8 h-8 text-primary animate-spin" />
                        <p className="mt-2 text-sm font-semibold text-primary">{t('scanning')}</p>
                        <p className="text-xs text-gray-500 truncate max-w-full px-2">{fileName}</p>
                    </div>
                );
            case 'success':
                 return (
                    <div className={`flex flex-col items-center justify-center ${contentHeight}`}>
                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                        <p className="mt-2 text-sm font-semibold text-green-600">{t('scanSuccess')}</p>
                        <p className="text-xs text-gray-500">{t('scanSuccessFields')}</p>
                    </div>
                );
            case 'error':
            case 'idle':
            default:
                return (
                     <div className={`flex flex-col items-center justify-center ${contentHeight}`}>
                        {scanState === 'error' 
                            ? <XCircle className="w-8 h-8 text-red-600" />
                            : <UploadCloud className="w-8 h-8 text-gray-400" />
                        }
                        <p className="mt-2 text-sm font-semibold text-primary">{t('uploadAndScan')}</p>
                        <p className="text-xs text-gray-500">{t('scanInstructions')}</p>
                    </div>
                );
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {isAdding && (
                 <>
                    <div>
                        <input type="file" id="passport-scan-input" className="hidden" onChange={handlePassportScan} accept="image/*,application/pdf" disabled={scanState === 'scanning'} />
                        <label htmlFor={scanState === 'scanning' ? undefined : 'passport-scan-input'} className={getScannerClasses()}>
                            {renderScannerContent()}
                        </label>
                        {scanState === 'error' && <p className="text-red-500 text-xs mt-2 text-center">{scanError}</p>}
                    </div>
                    <div className="relative flex py-1 items-center">
                        <div className="flex-grow border-t border-gray-200"></div>
                        <span className="flex-shrink mx-4 text-xs uppercase text-gray-400">{t('orEnterManually')}</span>
                        <div className="flex-grow border-t border-gray-200"></div>
                    </div>
                </>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-500">{t('customerName')}</label>
                    <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200" required />
                </div>
                 <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-500">{t('phone')}</label>
                    <input type="tel" id="phone" value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200" required />
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-500">{t('email')}</label>
                    <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200" />
                </div>
                <div>
                    <label htmlFor="age" className="block text-sm font-medium text-gray-500">{t('age')}</label>
                    <input type="number" id="age" value={age} onChange={e => setAge(Number(e.target.value))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200" required min="1" />
                </div>
                 <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-500">{t('gender')}</label>
                    <select id="gender" value={gender} onChange={e => setGender(e.target.value as 'Male' | 'Female')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200">
                        <option value="Male">{t('Male')}</option>
                        <option value="Female">{t('Female')}</option>
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="passportNumber" className="block text-sm font-medium text-gray-500">{t('passportNumber')}</label>
                    <input type="text" id="passportNumber" value={passportNumber} onChange={e => setPassportNumber(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200" required />
                </div>
                <div>
                    <label htmlFor="passportExpiry" className="block text-sm font-medium text-gray-500">{t('passportExpiry')}</label>
                    <input type="date" id="passportExpiry" value={passportExpiry} onChange={e => setPassportExpiry(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200" required />
                </div>
            </div>
            <div className="flex justify-end gap-4 pt-4 border-t mt-6">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors">{t('cancel')}</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors">{t('save')}</button>
            </div>
        </form>
    );
};

export default CustomerForm;