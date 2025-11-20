import React, { useState, useMemo, useRef, useEffect } from 'react';
import { SkillGoal, Course, AIFeedback, Reminder } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import { TrophyIcon, PlusIcon, TrashIcon, BellIcon, PaperclipIcon, LogoIcon, SpeakerIcon, StopIcon } from './icons';
import Header from './common/Header';
import { getSkillFeedback } from '../services/geminiService';
import { readFileAsBase64 } from '../utils/fileUtils';
import { useSpeech } from '../hooks/useSpeech';


const AIFeedbackModal: React.FC<{ feedback: AIFeedback | null, onClose: () => void }> = ({ feedback, onClose }) => {
    const { isSpeaking, speak, cancelSpeech } = useSpeech(() => {});

    useEffect(() => {
        return () => cancelSpeech();
    }, [cancelSpeech]);

    if (!feedback) return null;
    
    const handleToggleSpeech = () => {
        if(isSpeaking) {
            cancelSpeech();
        } else {
            const textToSpeak = `
                Feedback: ${feedback.feedback}.
                Suggested Next Steps: ${feedback.nextSteps.join(', ')}.
            `;
            speak(textToSpeak);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-8 space-y-6 relative transform transition-all" onClick={e => e.stopPropagation()}>
                <div className="text-center">
                    <div className="inline-block p-4 bg-primary-100 dark:bg-primary-900 rounded-full mb-4">
                        <TrophyIcon className="w-12 h-12 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="flex items-center justify-center gap-4">
                         <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Badge Unlocked!</h2>
                         <button onClick={handleToggleSpeech} className="p-1 text-gray-500 hover:text-primary-600">
                            {isSpeaking ? <StopIcon className="w-6 h-6" /> : <SpeakerIcon className="w-6 h-6" />}
                        </button>
                    </div>
                    <p className="text-lg font-semibold text-primary-500">{feedback.badgeName}</p>
                </div>
                <div>
                    <h3 className="font-semibold text-gray-700 dark:text-gray-200">Feedback:</h3>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">{feedback.feedback}</p>
                </div>
                 <div>
                    <h3 className="font-semibold text-gray-700 dark:text-gray-200">Suggested Next Steps:</h3>
                    <ul className="mt-2 space-y-2 list-disc list-inside text-gray-600 dark:text-gray-400">
                        {feedback.nextSteps.map((step, i) => <li key={i}>{step}</li>)}
                    </ul>
                </div>
                <button onClick={onClose} className="w-full mt-6 py-2 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold">
                    Awesome!
                </button>
            </div>
        </div>
    );
};


const SkillTracker: React.FC = () => {
    const [goals, setGoals] = useLocalStorage<SkillGoal[]>('skill-goals', []);
    const [courses, setCourses] = useLocalStorage<Course[]>('skill-courses', []);
    const [reminders, setReminders] = useLocalStorage<Reminder[]>('reminders', []);

    const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
    const [aiFeedback, setAIFeedback] = useState<AIFeedback | null>(null);
    const [isLoadingFeedback, setIsLoadingFeedback] = useState<string | null>(null);
    const [notification, setNotification] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    const coursesForSelectedGoal = useMemo(() => {
        return courses.filter(c => c.skillGoalId === selectedGoalId);
    }, [courses, selectedGoalId]);
    
    const showNotification = (message: string) => {
        setNotification(message);
        setTimeout(() => setNotification(''), 3000);
    };

    // --- Goal Handlers ---
    const handleAddGoal = () => {
        const newGoal: SkillGoal = {
            id: `goal-${Date.now()}`,
            title: 'New Skill Goal',
            description: 'Describe what you want to learn.',
            targetDate: new Date().toISOString().split('T')[0],
            status: 'In Progress',
        };
        setGoals(prev => [newGoal, ...prev]);
        setSelectedGoalId(newGoal.id);
    };

    const handleUpdateGoal = (id: string, field: keyof SkillGoal, value: string) => {
        setGoals(prev => prev.map(g => g.id === id ? { ...g, [field]: value } : g));
    };

    const handleDeleteGoal = (id: string) => {
        if (window.confirm("Delete this goal? This will also delete all associated courses.")) {
            setGoals(prev => prev.filter(g => g.id !== id));
            setCourses(prev => prev.filter(c => c.skillGoalId !== id));
            if (selectedGoalId === id) setSelectedGoalId(null);
        }
    };

    const handleGetFeedback = async (goal: SkillGoal) => {
        setIsLoadingFeedback(goal.id);
        try {
            const feedback = await getSkillFeedback(goal);
            setAIFeedback(feedback);
        } catch (error) {
            console.error(error);
            showNotification('Error getting AI feedback.');
        } finally {
            setIsLoadingFeedback(null);
        }
    };
    
    const handleAddReminder = (goal: SkillGoal) => {
        const reminderExists = reminders.some(r => r.title === `Complete Skill: ${goal.title}`);
        if(reminderExists) {
            showNotification('A reminder for this goal already exists.');
            return;
        }
        const newReminder: Reminder = {
            id: `rem-skill-${goal.id}`,
            title: `Complete Skill: ${goal.title}`,
            dueDate: goal.targetDate,
            completed: false
        };
        setReminders(prev => [...prev, newReminder]);
        showNotification('Reminder added!');
    }
    
    const handleCopyPortfolio = () => {
        let markdown = '# My Learning Portfolio\n\n';
        
        const completedGoals = goals.filter(g => g.status === 'Completed');
        if (completedGoals.length > 0) {
            markdown += '## 🏆 Completed Goals\n\n';
            completedGoals.forEach(g => {
                markdown += `### ${g.title}\n`;
                markdown += `- **Target Date**: ${new Date(g.targetDate).toLocaleDateString()}\n`;
                const goalCourses = courses.filter(c => c.skillGoalId === g.id && c.status === 'Completed');
                if (goalCourses.length > 0) {
                     markdown += `- **Completed Courses**: ${goalCourses.map(c => c.title).join(', ')}\n`;
                }
                markdown += '\n';
            });
        }
        
        navigator.clipboard.writeText(markdown);
        showNotification('Portfolio copied to clipboard!');
    };


    // --- Course Handlers ---
    const handleAddCourse = () => {
        if (!selectedGoalId) return;
        const newCourse: Course = {
            id: `course-${Date.now()}`,
            skillGoalId: selectedGoalId,
            title: 'New Course',
            platform: 'e.g., Coursera',
            status: 'Not Started',
        };
        setCourses(prev => [newCourse, ...prev]);
    };

    const handleUpdateCourse = (id: string, field: keyof Course, value: string) => {
        setCourses(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    const handleDeleteCourse = (id: string) => {
        setCourses(prev => prev.filter(c => c.id !== id));
    };
    
    const handleCertificateUpload = async (e: React.ChangeEvent<HTMLInputElement>, courseId: string) => {
        const file = e.target.files?.[0];
        if (file) {
            const base64 = await readFileAsBase64(file);
            setCourses(prev => prev.map(c => c.id === courseId ? { ...c, certificateImage: base64 } : c));
        }
    };


    return (
        <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-800">
            {notification && (
                <div className="absolute top-5 right-5 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg z-50">
                    {notification}
                </div>
            )}
            <AIFeedbackModal feedback={aiFeedback} onClose={() => setAIFeedback(null)} />
            <Header icon={<TrophyIcon className="w-5 h-5"/>} title="Skill Tracker" />
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Goals Pane */}
                <aside className="w-full md:w-1/3 md:max-w-md flex flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h2 className="text-lg font-semibold">Your Skill Goals</h2>
                        <div>
                             <button onClick={handleCopyPortfolio} title="Copy Portfolio to Clipboard" className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 mr-2">📄</button>
                             <button onClick={handleAddGoal} title="Add New Goal" className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><PlusIcon className="w-5 h-5"/></button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {goals.map(goal => (
                            <div key={goal.id} onClick={() => setSelectedGoalId(goal.id)} className={`p-4 rounded-lg cursor-pointer border-2 ${selectedGoalId === goal.id ? 'border-primary-500 bg-primary-50 dark:bg-gray-700/50' : 'border-transparent bg-gray-50 dark:bg-gray-900/50 hover:border-primary-300'}`}>
                                <h3 className="font-bold truncate">{goal.title}</h3>
                                <p className={`text-sm font-medium ${goal.status === 'Completed' ? 'text-green-500' : 'text-yellow-500'}`}>{goal.status}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Target: {new Date(goal.targetDate).toLocaleDateString()}</p>
                                <div className="mt-3 flex items-center justify-end gap-2">
                                     <button onClick={(e) => { e.stopPropagation(); handleAddReminder(goal); }} title="Add to Reminders" className="p-2 text-xs rounded-md bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"><BellIcon className="w-4 h-4"/></button>
                                    <button onClick={(e) => { e.stopPropagation(); handleGetFeedback(goal); }} disabled={isLoadingFeedback === goal.id} title="Get AI Feedback" className="p-2 text-xs rounded-md bg-primary-200 dark:bg-primary-900 hover:bg-primary-300 dark:hover:bg-primary-800 text-primary-700 dark:text-primary-300">
                                       {isLoadingFeedback === goal.id ? <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div> : <LogoIcon className="w-4 h-4"/>}
                                    </button>
                                     <button onClick={(e) => { e.stopPropagation(); handleDeleteGoal(goal.id); }} title="Delete Goal" className="p-2 text-xs rounded-md bg-red-200 dark:bg-red-900/50 hover:bg-red-300 dark:hover:bg-red-800/50 text-red-700 dark:text-red-300"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>
                
                {/* Editor Pane */}
                <main className="flex-1 flex flex-col overflow-y-auto">
                    {goals.find(g => g.id === selectedGoalId) ? (
                        <div className="flex-1 flex flex-col">
                            {/* Goal Editor */}
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
                                <input type="text" value={goals.find(g => g.id === selectedGoalId)!.title} onChange={e => handleUpdateGoal(selectedGoalId!, 'title', e.target.value)} className="text-2xl font-bold bg-transparent focus:outline-none w-full"/>
                                <textarea value={goals.find(g => g.id === selectedGoalId)!.description} onChange={e => handleUpdateGoal(selectedGoalId!, 'description', e.target.value)} placeholder="Description" className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 resize-none text-sm" rows={2}/>
                                <div className="flex items-center gap-4">
                                     <input type="date" value={goals.find(g => g.id === selectedGoalId)!.targetDate} onChange={e => handleUpdateGoal(selectedGoalId!, 'targetDate', e.target.value)} className="p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-sm"/>
                                     <select value={goals.find(g => g.id === selectedGoalId)!.status} onChange={e => handleUpdateGoal(selectedGoalId!, 'status', e.target.value)} className="p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-sm">
                                        <option>In Progress</option>
                                        <option>Completed</option>
                                    </select>
                                </div>
                            </div>
                             {/* Courses List */}
                            <div className="flex-1 p-4">
                               <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold">Courses for this Goal</h3>
                                    <button onClick={handleAddCourse} className="flex items-center gap-2 px-3 py-1.5 text-sm text-white bg-primary-600 rounded-lg hover:bg-primary-700 font-semibold"><PlusIcon className="w-4 h-4"/> Add Course</button>
                               </div>
                               <div className="space-y-3">
                                {coursesForSelectedGoal.map(course => (
                                    <div key={course.id} className="p-3 bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                                       <div className="flex items-start gap-4">
                                        <div className="flex-1 space-y-2">
                                            <input type="text" value={course.title} onChange={e => handleUpdateCourse(course.id, 'title', e.target.value)} className="font-semibold bg-transparent w-full focus:outline-none focus:border-b" />
                                            <input type="text" value={course.platform} onChange={e => handleUpdateCourse(course.id, 'platform', e.target.value)} className="text-sm text-gray-500 bg-transparent w-full focus:outline-none focus:border-b" />
                                            <select value={course.status} onChange={e => handleUpdateCourse(course.id, 'status', e.target.value)} className="text-xs p-1 border rounded bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                                                <option>Not Started</option><option>In Progress</option><option>Completed</option>
                                            </select>
                                        </div>
                                        <div className="flex flex-col items-center gap-2">
                                            <input type="file" ref={fileInputRef} onChange={(e) => handleCertificateUpload(e, course.id)} className="hidden" accept="image/*" />
                                            <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:text-primary-600"><PaperclipIcon className="w-5 h-5"/></button>
                                            {course.certificateImage && <img src={`data:image/png;base64,${course.certificateImage}`} alt="certificate" className="w-16 h-10 object-cover rounded"/>}
                                            <button onClick={() => handleDeleteCourse(course.id)} className="p-2 text-gray-400 hover:text-red-500"><TrashIcon className="w-4 h-4"/></button>
                                        </div>
                                       </div>
                                    </div>
                                ))}
                                {coursesForSelectedGoal.length === 0 && <p className="text-center text-gray-500 py-4">No courses added for this goal yet.</p>}
                               </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-center text-gray-500">
                            <div>
                                <TrophyIcon className="w-16 h-16 mx-auto mb-4 text-gray-400"/>
                                <h2 className="text-2xl font-semibold">Select a goal to manage it</h2>
                                <p>Or, create a new skill goal to get started!</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default SkillTracker;
