import React, { useState } from 'react';
import { Subject } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import { AttendanceIcon, PlusIcon, TrashIcon } from './icons';
import Header from './common/Header';

const AttendanceTracker: React.FC = () => {
    const [subjects, setSubjects] = useLocalStorage<Subject[]>('attendance-subjects', []);
    const [newSubjectName, setNewSubjectName] = useState('');

    const addSubject = () => {
        if (newSubjectName.trim() === '') return;
        const newSubject: Subject = {
            id: `subj-${Date.now()}`,
            name: newSubjectName.trim(),
            attended: 0,
            total: 0
        };
        setSubjects([...subjects, newSubject]);
        setNewSubjectName('');
    };

    const updateAttendance = (id: string, type: 'attended' | 'missed') => {
        setSubjects(subjects.map(s => {
            if (s.id === id) {
                const newTotal = s.total + 1;
                const newAttended = type === 'attended' ? s.attended + 1 : s.attended;
                return { ...s, total: newTotal, attended: newAttended };
            }
            return s;
        }));
    };

    const deleteSubject = (id: string) => {
        if (window.confirm("Are you sure you want to delete this subject?")) {
            setSubjects(subjects.filter(s => s.id !== id));
        }
    };
    
    const calculatePercentage = (attended: number, total: number) => {
        if (total === 0) return 0;
        return Math.round((attended / total) * 100);
    };

    return (
        <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-800">
            <Header icon={<AttendanceIcon className="w-5 h-5"/>} title="Attendance Tracker" />
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto">
                    {/* Add Subject Form */}
                    <div className="mb-8 p-4 bg-white dark:bg-gray-900 rounded-lg shadow">
                        <div className="flex items-center gap-4">
                            <input
                                type="text"
                                value={newSubjectName}
                                onChange={(e) => setNewSubjectName(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && addSubject()}
                                placeholder="Enter new subject name..."
                                className="flex-1 p-3 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                            />
                            <button
                                onClick={addSubject}
                                className="flex items-center gap-2 px-4 py-3 text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:bg-gray-400 transition font-semibold"
                            >
                                <PlusIcon className="w-5 h-5" />
                                <span>Add</span>
                            </button>
                        </div>
                    </div>

                    {/* Subjects List */}
                    {subjects.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-gray-500">No subjects added yet. Add a subject to start tracking!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {subjects.map(subject => {
                                const percentage = calculatePercentage(subject.attended, subject.total);
                                const progressBarColor = percentage >= 75 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500';
                                return (
                                <div key={subject.id} className="p-5 bg-white dark:bg-gray-900 rounded-lg shadow-lg transition hover:shadow-xl relative">
                                    <button onClick={() => deleteSubject(subject.id)} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500"><TrashIcon className="w-4 h-4"/></button>
                                    <h3 className="text-lg font-bold mb-2 truncate">{subject.name}</h3>
                                    <div className="my-4">
                                        <div className="flex justify-between items-center mb-1 text-sm">
                                            <span className="font-medium">{subject.attended} / {subject.total} classes</span>
                                            <span className={`font-bold ${percentage >= 75 ? 'text-green-600 dark:text-green-400' : percentage >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>{percentage}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                            <div className={`${progressBarColor} h-2.5 rounded-full transition-all duration-500`} style={{width: `${percentage}%`}}></div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between gap-3 mt-4">
                                        <button onClick={() => updateAttendance(subject.id, 'attended')} className="w-full py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition font-semibold text-sm">Attended</button>
                                        <button onClick={() => updateAttendance(subject.id, 'missed')} className="w-full py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition font-semibold text-sm">Missed</button>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AttendanceTracker;
