import React, { useState, useRef, useEffect, useCallback } from 'react';
import Modal from './Modal';
import { useApp } from '../hooks/useApp';
import type { Customer, DocumentFile } from '../types';
import { Upload, Trash2, Eye, File as FileIcon, X, LoaderCircle, CheckCircle } from 'lucide-react';

interface DocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  onAddDocument: (customer: Customer, document: DocumentFile) => void;
  onDeleteDocument: (customer: Customer, documentId: string) => void;
}

type UploadingFile = {
    id: string;
    file: File;
    name: string;
    type: 'passport' | 'photo' | 'other';
    progress: number;
    status: 'uploading' | 'success' | 'error';
    previewUrl?: string; // For image previews
};

const DocumentsModal: React.FC<DocumentsModalProps> = ({ isOpen, onClose, customer, onAddDocument, onDeleteDocument }) => {
    const { t } = useApp();
    const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Clean up object URLs on component unmount
    useEffect(() => {
        return () => {
            uploadingFiles.forEach(f => {
                if (f.previewUrl) {
                    URL.revokeObjectURL(f.previewUrl);
                }
            });
        };
    }, [uploadingFiles]);

    const simulateUpload = useCallback((uploadId: string) => {
        const interval = setInterval(() => {
            setUploadingFiles(currentFiles => {
                const fileToUpdate = currentFiles.find(f => f.id === uploadId);
                if (!fileToUpdate || fileToUpdate.status !== 'uploading') {
                    clearInterval(interval);
                    return currentFiles;
                }

                const newProgress = fileToUpdate.progress + Math.floor(Math.random() * 15) + 5;

                if (newProgress >= 100) {
                    clearInterval(interval);
                    
                    const newDocument: DocumentFile = {
                        id: `DOC-${Date.now()}-${fileToUpdate.file.name.slice(0, 5)}`,
                        name: fileToUpdate.name,
                        type: fileToUpdate.type,
                        // For this mock app, we store the blob URL. A real app would get a URL from a storage service.
                        url: fileToUpdate.previewUrl || URL.createObjectURL(fileToUpdate.file),
                    };
                    onAddDocument(customer, newDocument);

                    return currentFiles.map(f => f.id === uploadId ? { ...f, progress: 100, status: 'success' } : f);
                } else {
                    return currentFiles.map(f => f.id === uploadId ? { ...f, progress: newProgress } : f);
                }
            });
        }, 300);
    }, [onAddDocument, customer]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles: UploadingFile[] = Array.from(e.target.files).map((file: File) => {
                const isImage = file.type.startsWith('image/');
                return {
                    id: `upload-${Date.now()}-${Math.random()}`,
                    file,
                    name: file.name.replace(/\.[^/.]+$/, ""),
                    type: 'other',
                    progress: 0,
                    status: 'uploading',
                    previewUrl: isImage ? URL.createObjectURL(file) : undefined,
                }
            });
            
            setUploadingFiles(prev => [...prev, ...newFiles]);
            newFiles.forEach(file => simulateUpload(file.id));
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleUpdateUploadingFile = (id: string, field: 'name' | 'type', value: string) => {
        setUploadingFiles(prev => prev.map(f => 
            f.id === id ? { ...f, [field]: value } : f
        ));
    };

    const cancelUpload = (uploadId: string) => {
        const fileToCancel = uploadingFiles.find(f => f.id === uploadId);
        if (fileToCancel?.previewUrl) {
            URL.revokeObjectURL(fileToCancel.previewUrl);
        }
        setUploadingFiles(prev => prev.filter(f => f.id !== uploadId));
    };

    const handleDelete = (docId: string) => {
        if (window.confirm(t('confirmDeleteDocument'))) {
            onDeleteDocument(customer, docId);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${t('manageDocuments')} - ${customer.name}`}>
            <div className="space-y-6">
                {/* File Upload Area */}
                <div>
                    <input ref={fileInputRef} type="file" id="doc-upload" multiple onChange={handleFileChange} className="hidden" />
                    <label htmlFor="doc-upload" className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                        <Upload className="w-10 h-10 text-gray-400 mb-2" />
                        <p className="font-semibold text-primary">{t('selectOrDrop')}</p>
                        <p className="text-xs text-gray-500">{t('scanInstructions')}</p>
                    </label>
                </div>
                
                {/* Uploading Files Section */}
                {uploadingFiles.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="font-semibold text-lg text-gray-800">{t('uploadingFiles')}</h4>
                        <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                            {uploadingFiles.map(upload => (
                                <div key={upload.id} className="p-3 border rounded-lg bg-gray-50 space-y-3">
                                    <div className="flex items-start gap-3">
                                        {upload.previewUrl ? (
                                            <img src={upload.previewUrl} alt="Preview" className="w-12 h-12 object-cover rounded flex-shrink-0" />
                                        ) : (
                                            <div className="w-12 h-12 bg-gray-200 flex items-center justify-center rounded flex-shrink-0">
                                                <FileIcon className="w-6 h-6 text-gray-500" />
                                            </div>
                                        )}
                                        <div className="flex-grow space-y-2">
                                            <input 
                                                type="text"
                                                value={upload.name}
                                                onChange={(e) => handleUpdateUploadingFile(upload.id, 'name', e.target.value)}
                                                placeholder={t('documentName')}
                                                className="w-full text-sm px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary transition-all duration-200"
                                                disabled={upload.status !== 'uploading'}
                                            />
                                            <select 
                                                value={upload.type}
                                                onChange={(e) => handleUpdateUploadingFile(upload.id, 'type', e.target.value)}
                                                className="w-full text-sm px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary transition-all duration-200"
                                                disabled={upload.status !== 'uploading'}
                                            >
                                                <option value="other">Other</option>
                                                <option value="passport">Passport</option>
                                                <option value="photo">Photo</option>
                                            </select>
                                        </div>
                                        <button onClick={() => cancelUpload(upload.id)} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 flex-shrink-0">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div className="bg-primary h-2.5 rounded-full transition-all duration-300" style={{width: `${upload.progress}%`}}></div>
                                        </div>
                                        {upload.status === 'uploading' && <LoaderCircle className="w-4 h-4 text-primary animate-spin" />}
                                        {upload.status === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                <div className="border-t pt-4"></div>

                {/* Saved Documents Section */}
                <div>
                    <h4 className="font-semibold text-lg text-gray-800 mb-3">{t('savedDocuments')}</h4>
                    {customer.documents.length > 0 ? (
                        <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {customer.documents.map(doc => (
                                <li key={doc.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border">
                                    <div className="flex items-center gap-3">
                                         <div className="w-8 h-8 bg-primary/10 flex items-center justify-center rounded">
                                            <FileIcon className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-800">{doc.name}</p>
                                            <p className="text-xs text-gray-500 capitalize">{doc.type}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-500 hover:text-gray-800" title={t('view')}>
                                            <Eye className="w-5 h-5" />
                                        </a>
                                        <button onClick={() => handleDelete(doc.id)} className="p-2 text-accent hover:text-red-800" title={t('delete')}>
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-sm text-gray-500 py-4">{t('noDocuments')}</p>
                    )}
                </div>

                <div className="flex justify-end pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">{t('close')}</button>
                </div>
            </div>
        </Modal>
    );
};

export default DocumentsModal;