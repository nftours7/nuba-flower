



import React, { useState, useMemo } from 'react';
import { useApp } from '../hooks/useApp';
import { PlusCircle, Edit, Trash2, X, ClipboardCheck } from 'lucide-react';
import Modal from '../components/Modal';
import TaskForm from '../components/TaskForm';
import ConfirmationModal from '../components/ConfirmationModal';
import EmptyState from '../components/EmptyState';
import type { Task, TaskPriority } from '../types';

const priorityColors: Record<TaskPriority, string> = {
    High: 'bg-red-100 text-red-800',
    Medium: 'bg-yellow-100 text-yellow-800',
    Low: 'bg-gray-100 text-gray-800',
};

const taskPriorities: TaskPriority[] = ['High', 'Medium', 'Low'];

const Tasks: React.FC = () => {
    const { t, tasks, setTasks, bookings, customers, addToast, currentUser, logActivity } = useApp();
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

    // Filters
    const [statusFilter, setStatusFilter] = useState('incomplete');
    const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'All'>('All');

    const filteredTasks = useMemo(() => {
        const priorityOrder: Record<TaskPriority, number> = { 'High': 1, 'Medium': 2, 'Low': 3 };

        return tasks
            .filter(task => {
                if (statusFilter === 'completed') return task.isCompleted;
                if (statusFilter === 'incomplete') return !task.isCompleted;
                return true; // 'all'
            })
            .filter(task => {
                if (priorityFilter === 'All') return true;
                return task.priority === priorityFilter;
            })
            .sort((a, b) => {
                // 1. Incomplete tasks before completed tasks
                if (a.isCompleted !== b.isCompleted) {
                    return a.isCompleted ? 1 : -1;
                }
                // 2. Sort by due date (ascending)
                const dateA = new Date(a.dueDate).getTime();
                const dateB = new Date(b.dueDate).getTime();
                if (dateA !== dateB) {
                    return dateA - dateB;
                }
                // 3. Sort by priority (High > Medium > Low) for same-day tasks
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            });
    }, [tasks, statusFilter, priorityFilter]);
    
    const resetFilters = () => {
        setStatusFilter('all');
        setPriorityFilter('All');
    };

    const handleSaveTask = (taskData: Omit<Task, 'id' | 'isCompleted'> & { id?: string }) => {
        if (taskData.id) {
            setTasks(prev => prev.map(t => t.id === taskData.id ? { ...t, ...taskData } as Task : t));
            logActivity('Updated', 'Task', taskData.id, taskData.title);
        } else {
            const newTask: Task = {
                id: `T${Date.now()}`,
                ...taskData,
                isCompleted: false
            } as Task;
            setTasks(prev => [newTask, ...prev]);
            logActivity('Created', 'Task', newTask.id, newTask.title);
        }
        setIsFormModalOpen(false);
        setEditingTask(null);
        addToast({ title: t('success'), message: t('taskSavedSuccess'), type: 'success' });
    };

    const handleDeleteTask = (taskId: string) => {
        setDeletingTaskId(taskId);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteTask = () => {
        if (!deletingTaskId) return;
        const taskToDelete = tasks.find(t => t.id === deletingTaskId);
        if(taskToDelete){
            setTasks(prev => prev.filter(t => t.id !== deletingTaskId));
            addToast({ title: t('success'), message: t('taskDeletedSuccess'), type: 'success' });
            logActivity('Deleted', 'Task', deletingTaskId, taskToDelete.title);
        }
        setDeletingTaskId(null);
        setIsDeleteModalOpen(false);
    };
    
    const handleToggleComplete = (taskId: string) => {
        let isCompletedNow = false;
        const task = tasks.find(t => t.id === taskId);
        if(!task) return;

        setTasks(prev => prev.map(task => {
            if (task.id === taskId) {
                isCompletedNow = !task.isCompleted;
                return { ...task, isCompleted: isCompletedNow };
            }
            return task;
        }));
        
        addToast({ title: t('success'), message: t('taskStatusChanged'), type: 'success' });
        logActivity(isCompletedNow ? 'Completed' : 'Incomplete', 'Task', taskId, task.title);
    };

    const handleOpenEditModal = (task: Task) => {
        setEditingTask(task);
        setIsFormModalOpen(true);
    };

    const handleOpenAddModal = () => {
        setEditingTask(null);
        setIsFormModalOpen(true);
    };
    
    const isOverdue = (dueDate: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of day
        return new Date(dueDate) < today;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-800">{t('tasks')}</h1>
                <button onClick={handleOpenAddModal} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
                    <PlusCircle className="w-5 h-5" />
                    <span>{t('addTask')}</span>
                </button>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-md flex flex-col sm:flex-row flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                    <label htmlFor="statusFilter" className="text-sm font-medium text-gray-500">{t('status')}:</label>
                    <select id="statusFilter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition-all duration-200">
                        <option value="all">{t('all')}</option>
                        <option value="incomplete">{t('Incomplete')}</option>
                        <option value="completed">{t('Completed')}</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <label htmlFor="priorityFilter" className="text-sm font-medium text-gray-500">{t('priority')}:</label>
                    <select id="priorityFilter" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value as any)} className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition-all duration-200">
                        <option value="All">{t('all')}</option>
                        {taskPriorities.map(p => <option key={p} value={p}>{t(p)}</option>)}
                    </select>
                </div>
                <div className="flex-grow"></div>
                <button onClick={resetFilters} className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                    <X className="w-4 h-4" />
                    <span>{t('resetFilters')}</span>
                </button>
            </div>

            {filteredTasks.length > 0 ? (
                <div className="bg-white rounded-xl shadow-md overflow-x-auto">
                    <table className="w-full text-sm text-start text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="p-4"></th>
                                <th scope="col" className="px-6 py-3">{t('taskTitle')}</th>
                                <th scope="col" className="px-6 py-3">{t('relatedBooking')}</th>
                                <th scope="col" className="px-6 py-3">{t('dueDate')}</th>
                                <th scope="col" className="px-6 py-3">{t('priority')}</th>
                                <th scope="col" className="px-6 py-3 text-center">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTasks.map(task => {
                                const booking = bookings.find(b => b.id === task.bookingId);
                                const customer = customers.find(c => c.id === booking?.customerId);
                                const isTaskOverdue = isOverdue(task.dueDate) && !task.isCompleted;

                                return (
                                    <tr key={task.id} className={`border-b transition-colors duration-150 ${task.isCompleted ? 'bg-gray-50 text-gray-400 line-through' : 'bg-white hover:bg-gray-50'} ${isTaskOverdue ? 'border-s-4 border-red-500' : 'border-s-4 border-transparent'}`}>
                                        <td className="p-4">
                                            <input type="checkbox" checked={task.isCompleted} onChange={() => handleToggleComplete(task.id)} className="w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary" />
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{task.title}</td>
                                        <td className="px-6 py-4">{booking ? `${booking.id} (${customer?.name})` : t('noRelatedBooking')}</td>
                                        <td className={`px-6 py-4 ${isTaskOverdue ? 'text-red-600 font-semibold' : ''}`}>
                                            {new Date(task.dueDate).toLocaleDateString()}
                                            {isTaskOverdue && <span className="ms-2 text-xs">({t('overdue')})</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[task.priority]}`}>{t(task.priority)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center items-center gap-4">
                                                <button onClick={() => handleOpenEditModal(task)} className="text-blue-600 hover:text-blue-800" title={t('edit')}><Edit className="w-5 h-5" /></button>
                                                {['Admin', 'Manager'].includes(currentUser?.role || '') && (
                                                    <button onClick={() => handleDeleteTask(task.id)} className="text-accent hover:text-red-800" title={t('delete')}><Trash2 className="w-5 h-5" /></button>
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
                    icon={ClipboardCheck}
                    title={t('noTasksFound')}
                    message={t('noTasksFoundSub')}
                    actionText={tasks.length === 0 ? t('addTask') : t('resetFilters')}
                    onAction={tasks.length === 0 ? handleOpenAddModal : resetFilters}
                />
            )}

            <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={editingTask ? t('editTask') : t('addTask')}>
                <TaskForm onSave={handleSaveTask} onCancel={() => setIsFormModalOpen(false)} task={editingTask} />
            </Modal>
            
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDeleteTask}
                title={t('confirmDeletionTitle')}
                message={t('confirmDeletionMessage')}
            />
        </div>
    );
};

export default Tasks;