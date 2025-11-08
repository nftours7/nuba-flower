import React, { useState, useEffect } from 'react';
import { useApp } from '../hooks/useApp';
import type { Task, TaskPriority } from '../types';

interface TaskFormProps {
  onSave: (task: Omit<Task, 'id' | 'isCompleted'> & { id?: string }) => void;
  onCancel: () => void;
  task?: Task | null;
}

const taskPriorities: TaskPriority[] = ['High', 'Medium', 'Low'];

const TaskForm: React.FC<TaskFormProps> = ({ onSave, onCancel, task }) => {
    const { t, bookings, customers } = useApp();
    const [title, setTitle] = useState('');
    const [bookingId, setBookingId] = useState<string | undefined>(undefined);
    const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
    const [priority, setPriority] = useState<TaskPriority>('Medium');

    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setBookingId(task.bookingId);
            setDueDate(task.dueDate);
            setPriority(task.priority);
        } else {
            setTitle('');
            setBookingId(undefined);
            setDueDate(new Date().toISOString().split('T')[0]);
            setPriority('Medium');
        }
    }, [task]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !dueDate) {
            alert('Please fill all required fields.');
            return;
        }
        onSave({
            id: task?.id,
            title,
            bookingId,
            dueDate,
            priority,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-500">{t('taskTitle')}</label>
                <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200" required />
            </div>
            <div>
                <label htmlFor="bookingId" className="block text-sm font-medium text-gray-500">{t('relatedBooking')}</label>
                <select 
                    id="bookingId" 
                    value={bookingId || ''} 
                    onChange={e => setBookingId(e.target.value || undefined)} 
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200"
                >
                    <option value="">{t('noRelatedBooking')}</option>
                    {bookings.map(b => {
                        const customer = customers.find(c => c.id === b.customerId);
                        return (
                            <option key={b.id} value={b.id}>
                                {b.id} - {customer?.name || 'N/A'}
                            </option>
                        );
                    })}
                </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="dueDate" className="block text-sm font-medium text-gray-500">{t('dueDate')}</label>
                    <input type="date" id="dueDate" value={dueDate} onChange={e => setDueDate(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200" required />
                </div>
                <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-500">{t('priority')}</label>
                    <select id="priority" value={priority} onChange={e => setPriority(e.target.value as TaskPriority)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200">
                        {taskPriorities.map(p => (
                           <option key={p} value={p}>{t(p)}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="flex justify-end gap-4 pt-4 border-t mt-6">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors">{t('cancel')}</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors">{t('save')}</button>
            </div>
        </form>
    );
};

export default TaskForm;