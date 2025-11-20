import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Project, ProjectTask, ProjectResource, AIProjectIdea, TaskStatus } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import { ProjectIcon, PlusIcon, TrashIcon, PaperclipIcon, LogoIcon, SpeakerIcon, StopIcon } from './icons';
import Header from './common/Header';
import { getProjectIdeas } from '../services/geminiService';
import { readFileAsBase64 } from '../utils/fileUtils';
import { useSpeech } from '../hooks/useSpeech';

const AIIdeaModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSelectIdea: (idea: AIProjectIdea) => void;
}> = ({ isOpen, onClose, onSelectIdea }) => {
    const [interests, setInterests] = useState('');
    const [ideas, setIdeas] = useState<AIProjectIdea[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { isSpeaking, speak, cancelSpeech } = useSpeech(() => {});
    const [speakingIdeaIndex, setSpeakingIdeaIndex] = useState<number | null>(null);

    useEffect(() => {
        if (!isSpeaking) {
            setSpeakingIdeaIndex(null);
        }
    }, [isSpeaking]);
    
    useEffect(() => {
        // Stop speech when modal is closed
        if (!isOpen) {
            cancelSpeech();
        }
    }, [isOpen, cancelSpeech]);


    const handleGenerate = async () => {
        if (!interests.trim()) {
            setError('Please describe your interests.');
            return;
        }
        setIsLoading(true);
        setError('');
        setIdeas([]);
        cancelSpeech();
        try {
            const result = await getProjectIdeas(interests);
            setIdeas(result);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to get ideas.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleToggleSpeech = (index: number, idea: AIProjectIdea) => {
        if (speakingIdeaIndex === index) {
            cancelSpeech();
        } else {
            const textToSpeak = `
                Title: ${idea.title}.
                Description: ${idea.description}.
                Key Features: ${idea.keyFeatures.join(', ')}.
                Tech Stack: ${idea.techStack.join(', ')}.
            `;
            speak(textToSpeak);
            setSpeakingIdeaIndex(index);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-center">AI Project Idea Generator</h2>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={interests}
                        onChange={e => setInterests(e.target.value)}
                        placeholder="e.g., 'machine learning and web development'"
                        className="flex-1 p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    />
                    <button onClick={handleGenerate} disabled={isLoading} className="px-4 py-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:bg-gray-400 font-semibold">
                        {isLoading ? 'Generating...' : 'Generate'}
                    </button>
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div className="flex-1 overflow-y-auto space-y-4">
                    {isLoading && <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>}
                    {ideas.map((idea, i) => (
                        <div key={i} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/50">
                             <div className="flex justify-between items-start">
                                <h3 className="font-bold text-lg flex-1">{idea.title}</h3>
                                <button onClick={() => handleToggleSpeech(i, idea)} className="p-1 text-gray-500 hover:text-primary-600">
                                    {speakingIdeaIndex === i ? <StopIcon className="w-5 h-5" /> : <SpeakerIcon className="w-5 h-5" />}
                                </button>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 my-2">{idea.description}</p>
                            <div className="text-xs space-y-1">
                                <p><b>Features:</b> {idea.keyFeatures.join(', ')}</p>
                                <p><b>Tech:</b> {idea.techStack.join(', ')}</p>
                                {idea.datasetSource && <p><b>Dataset:</b> {idea.datasetSource}</p>}
                                {idea.architecture && <p><b>Architecture:</b> {idea.architecture}</p>}
                                {idea.deploymentTips && <p><b>Deployment:</b> {idea.deploymentTips}</p>}
                            </div>
                            <button onClick={() => onSelectIdea(idea)} className="mt-3 px-3 py-1 text-sm text-white bg-green-600 rounded-md hover:bg-green-700 font-semibold">
                                Use This Idea
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const TaskColumn: React.FC<{
    title: TaskStatus;
    tasks: ProjectTask[];
    onUpdateTask: (id: string, field: keyof ProjectTask, value: any) => void;
    onDeleteTask: (id: string) => void;
}> = ({ title, tasks, onUpdateTask, onDeleteTask }) => {
    const statusColor = {
        "To Do": "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200",
        "In Progress": "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200",
        "Done": "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200",
    };

    return (
        <div className="flex-1 bg-gray-100 dark:bg-gray-800/50 rounded-lg p-3">
            <h3 className={`text-sm font-semibold uppercase px-2 py-1 rounded-md inline-block mb-4 ${statusColor[title]}`}>{title}</h3>
            <div className="space-y-3 h-full">
                {tasks.map(task => (
                    <div key={task.id} className="bg-white dark:bg-gray-900 p-3 rounded-md shadow-sm border border-gray-200 dark:border-gray-700 relative">
                        <textarea value={task.title} onChange={e => onUpdateTask(task.id, 'title', e.target.value)} rows={2} className="text-sm font-medium bg-transparent w-full resize-none focus:outline-none focus:ring-1 focus:ring-primary-500 rounded-md p-1" />
                        <div className="flex items-center justify-between mt-2">
                            <input type="text" value={task.assignedTo} onChange={e => onUpdateTask(task.id, 'assignedTo', e.target.value)} placeholder="Assignee" className="text-xs bg-gray-100 dark:bg-gray-700 rounded-md px-2 py-1 focus:outline-none w-2/3"/>
                            <select value={task.status} onChange={e => onUpdateTask(task.id, 'status', e.target.value)} className="text-xs p-1 border rounded bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                                <option>To Do</option><option>In Progress</option><option>Done</option>
                            </select>
                        </div>
                         <button onClick={() => onDeleteTask(task.id)} className="absolute top-1 right-1 p-1 text-gray-400 hover:text-red-500"><TrashIcon className="w-3 h-3"/></button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ProjectPlanner: React.FC = () => {
    const [projects, setProjects] = useLocalStorage<Project[]>('projects', []);
    const [tasks, setTasks] = useLocalStorage<ProjectTask[]>('project-tasks', []);
    const [resources, setResources] = useLocalStorage<ProjectResource[]>('project-resources', []);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [isIdeaModalOpen, setIdeaModalOpen] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const selectedProject = useMemo(() => projects.find(p => p.id === selectedProjectId), [projects, selectedProjectId]);
    const filteredTasks = useMemo(() => tasks.filter(t => t.projectId === selectedProjectId), [tasks, selectedProjectId]);
    const filteredResources = useMemo(() => resources.filter(r => r.projectId === selectedProjectId), [resources, selectedProjectId]);

    const handleAddProject = (idea?: AIProjectIdea) => {
        const newProject: Project = {
            id: `proj-${Date.now()}`,
            name: idea?.title || 'New Project',
            description: idea?.description || 'Project description here.',
            team: '',
        };
        setProjects(prev => [newProject, ...prev]);
        setSelectedProjectId(newProject.id);
    };
    
    const handleUpdateProject = (id: string, field: keyof Project, value: string) => {
        setProjects(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const handleDeleteProject = (id: string) => {
        if (window.confirm("Delete this project and all its tasks and resources?")) {
            setProjects(prev => prev.filter(p => p.id !== id));
            setTasks(prev => prev.filter(t => t.projectId !== id));
            setResources(prev => prev.filter(r => r.projectId !== id));
            if (selectedProjectId === id) setSelectedProjectId(null);
        }
    };
    
    const handleUseIdea = (idea: AIProjectIdea) => {
        handleAddProject(idea);
        setIdeaModalOpen(false);
    };

    const handleAddTask = () => {
        if (!selectedProjectId) return;
        const newTask: ProjectTask = { id: `task-${Date.now()}`, projectId: selectedProjectId, title: 'New Task', assignedTo: '', status: 'To Do' };
        setTasks(prev => [...prev, newTask]);
    };
    
    const handleUpdateTask = (id: string, field: keyof ProjectTask, value: any) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
    };

    const handleDeleteTask = (id: string) => setTasks(prev => prev.filter(t => t.id !== id));

    const handleAddResource = async (newResource: Omit<ProjectResource, 'id' | 'projectId'>) => {
        if (!selectedProjectId) return;
        const finalResource: ProjectResource = { ...newResource, id: `res-${Date.now()}`, projectId: selectedProjectId };
        setResources(prev => [...prev, finalResource]);
    };

    const handleAddLink = () => {
        const url = window.prompt("Enter resource URL:");
        if (url) {
            const name = window.prompt("Enter resource name:", new URL(url).hostname);
            if (name) {
                handleAddResource({ name, type: 'link', url });
            }
        }
    };
    
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const fileContent = await readFileAsBase64(file);
            handleAddResource({ name: file.name, type: 'file', fileContent, fileName: file.name, mimeType: file.type });
        }
    };

    const handleDeleteResource = (id: string) => setResources(prev => prev.filter(r => r.id !== id));

    return (
        <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-800">
            <AIIdeaModal isOpen={isIdeaModalOpen} onClose={() => setIdeaModalOpen(false)} onSelectIdea={handleUseIdea} />
            <Header icon={<ProjectIcon className="w-5 h-5"/>} title="Project Planner" />
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Projects List Pane */}
                <aside className="w-full md:w-1/3 md:max-w-sm flex flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h2 className="text-lg font-semibold">Your Projects</h2>
                        <div>
                            <button onClick={() => setIdeaModalOpen(true)} title="Get AI Ideas" className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><LogoIcon className="w-5 h-5"/></button>
                            <button onClick={() => handleAddProject()} title="Add New Project" className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><PlusIcon className="w-5 h-5"/></button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        {projects.map(project => (
                             <div key={project.id} onClick={() => setSelectedProjectId(project.id)} className={`p-3 rounded-lg cursor-pointer border-2 ${selectedProjectId === project.id ? 'border-primary-500 bg-primary-50 dark:bg-gray-700/50' : 'border-transparent bg-gray-50 dark:bg-gray-900/50 hover:border-primary-300'}`}>
                                <h3 className="font-semibold truncate">{project.name}</h3>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Main Content Pane */}
                <main className="flex-1 flex flex-col overflow-y-auto p-4 md:p-6 space-y-6">
                    {selectedProject ? (
                        <>
                            {/* Project Details */}
                            <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm">
                                 <div className="flex justify-between items-start">
                                    <input type="text" value={selectedProject.name} onChange={e => handleUpdateProject(selectedProject.id, 'name', e.target.value)} className="text-2xl font-bold bg-transparent focus:outline-none w-full"/>
                                    <button onClick={() => handleDeleteProject(selectedProject.id)} className="p-2 text-gray-500 hover:text-red-500"><TrashIcon className="w-5 h-5"/></button>
                                </div>
                                <textarea value={selectedProject.description} onChange={e => handleUpdateProject(selectedProject.id, 'description', e.target.value)} placeholder="Description" className="w-full mt-2 p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 resize-none text-sm" rows={2}/>
                                <div className="mt-2">
                                    <label className="text-sm font-medium">Team (comma-separated):</label>
                                    <input type="text" value={selectedProject.team} onChange={e => handleUpdateProject(selectedProject.id, 'team', e.target.value)} className="w-full mt-1 p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-sm"/>
                                </div>
                            </div>
                            {/* Task Board */}
                            <div>
                                <h3 className="text-xl font-semibold mb-3">Task Board</h3>
                                <div className="flex flex-col md:flex-row gap-4 min-h-[300px]">
                                    <TaskColumn title="To Do" tasks={filteredTasks.filter(t => t.status === 'To Do')} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteTask} />
                                    <TaskColumn title="In Progress" tasks={filteredTasks.filter(t => t.status === 'In Progress')} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteTask} />
                                    <TaskColumn title="Done" tasks={filteredTasks.filter(t => t.status === 'Done')} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteTask} />
                                </div>
                                 <button onClick={handleAddTask} className="mt-4 flex items-center gap-2 px-3 py-1.5 text-sm text-white bg-primary-600 rounded-lg hover:bg-primary-700 font-semibold"><PlusIcon className="w-4 h-4"/> Add Task</button>
                            </div>
                             {/* Resources */}
                            <div>
                                <h3 className="text-xl font-semibold mb-3">Resources</h3>
                                <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm space-y-2">
                                {filteredResources.map(res => (
                                    <div key={res.id} className="flex items-center justify-between p-2 rounded-md bg-gray-50 dark:bg-gray-800">
                                        <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary-600 hover:underline">{res.name}</a>
                                        <button onClick={() => handleDeleteResource(res.id)} className="p-1 text-gray-400 hover:text-red-500"><TrashIcon className="w-4 h-4"/></button>
                                    </div>
                                ))}
                                {filteredResources.length === 0 && <p className="text-sm text-center text-gray-500">No resources added.</p>}
                                <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                    <button onClick={handleAddLink} className="flex-1 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">Add Link</button>
                                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                                    <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">Upload File</button>
                                </div>
                                </div>
                            </div>
                        </>
                    ) : (
                         <div className="flex-1 flex items-center justify-center text-center text-gray-500">
                            <div>
                                <ProjectIcon className="w-16 h-16 mx-auto mb-4 text-gray-400"/>
                                <h2 className="text-2xl font-semibold">Select a project to view it</h2>
                                <p>Or, create a new project to get started!</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default ProjectPlanner;
