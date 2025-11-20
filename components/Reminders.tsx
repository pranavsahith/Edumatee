import React, { useState, useMemo } from 'react';
import { Reminder } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import { BellIcon, PlusIcon, TrashIcon, CheckCircleIcon } from './icons';
import Header from './common/Header';

const Reminders: React.FC = () => {
    const [reminders, setReminders] = useLocalStorage<Reminder[]>('reminders', []);
    const [newReminderTitle, setNewReminderTitle] = useState('');
    const [newReminderDate, setNewReminderDate] = useState('');

    const addReminder = () => {
        if (!newReminderTitle.trim() || !newReminderDate) return;
        const newReminder: Reminder = {
            id: `rem-${Date.now()}`,
            title: newReminderTitle.trim(),
            dueDate: newReminderDate,
            completed: false,
        };
        setReminders([...reminders, newReminder]);
        setNewReminderTitle('');
        setNewReminderDate('');
    };

    const toggleReminder = (id: string) => {
        setReminders(reminders.map(r => r.id === id ? { ...r, completed: !r.completed } : r));
    };

    const deleteReminder = (id: string) => {
        setReminders(reminders.filter(r => r.id !== id));
    };

    const sortedReminders = useMemo(() => {
        return [...reminders].sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });
    }, [reminders]);

    const isOverdue = (dueDate: string) => {
        const due = new Date(dueDate);
        due.setHours(23, 59, 59, 999); // Set to end of day
        return due.getTime() < Date.now();
    };


    return (
        <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-800">
            <Header icon={<BellIcon className="w-5 h-5"/>} title="Assignment Reminders" />
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-2xl mx-auto">
                    {/* Add Reminder Form */}
                    <div className="mb-8 p-4 bg-white dark:bg-gray-900 rounded-lg shadow">
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input
                                type="text"
                                value={newReminderTitle}
                                onChange={(e) => setNewReminderTitle(e.target.value)}
                                placeholder="Assignment or task..."
                                className="md:col-span-2 p-3 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500"
                            />
                             <input
                                type="date"
                                value={newReminderDate}
                                onChange={(e) => setNewReminderDate(e.target.value)}
                                className="p-3 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <button
                            onClick={addReminder}
                            className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:bg-gray-400 transition font-semibold"
                        >
                            <PlusIcon className="w-5 h-5" />
                            <span>Add Reminder</span>
                        </button>
                    </div>

                    {/* Reminders List */}
                    <div className="space-y-4">
                        {sortedReminders.length > 0 ? sortedReminders.map(reminder => (
                            <div key={reminder.id} className={`p-4 rounded-lg shadow flex items-center gap-4 transition ${reminder.completed ? 'bg-gray-200 dark:bg-gray-700/50 opacity-60' : 'bg-white dark:bg-gray-900'}`}>
                                <button onClick={() => toggleReminder(reminder.id)} className="flex-shrink-0">
                                    {reminder.completed ? (
                                        <CheckCircleIcon className="w-6 h-6 text-green-500"/>
                                    ) : (
                                        <div className="w-6 h-6 border-2 border-gray-400 rounded-full"></div>
                                    )}
                                </button>
                                <div className="flex-1">
                                    <p className={`font-medium ${reminder.completed ? 'line-through' : ''}`}>{reminder.title}</p>
                                    <p className={`text-sm ${reminder.completed ? 'text-gray-500' : isOverdue(reminder.dueDate) ? 'text-red-500 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
                                        Due: {new Date(reminder.dueDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                                <button onClick={() => deleteReminder(reminder.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                                    <TrashIcon className="w-5 h-5"/>
                                </button>
                            </div>
                        )) : (
                            <div className="text-center py-10">
                                <p className="text-gray-500">No reminders yet. Stay organized by adding one!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reminders;