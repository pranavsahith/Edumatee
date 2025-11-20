import React, { useState, useMemo } from 'react';
import { Note } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import { NotesIcon, PlusIcon, TrashIcon } from './icons';
import Header from './common/Header';
import { marked } from 'marked';

const ClassNotes: React.FC = () => {
    const [notes, setNotes] = useLocalStorage<Note[]>('class-notes', []);
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
    const [filterSubject, setFilterSubject] = useState<string>('all');

    const subjects = useMemo(() => ['all', ...Array.from(new Set(notes.map(n => n.subject)))], [notes]);
    const filteredNotes = useMemo(() => {
        return notes
            .filter(n => filterSubject === 'all' || n.subject === filterSubject)
            .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
    }, [notes, filterSubject]);

    const selectedNote = useMemo(() => notes.find(n => n.id === selectedNoteId), [notes, selectedNoteId]);

    const handleSelectNote = (id: string) => {
        setSelectedNoteId(id);
    };

    const handleAddNewNote = () => {
        const newNote: Note = {
            id: `note-${Date.now()}`,
            title: 'New Note',
            subject: 'General',
            content: '# New Note\n\nStart writing here...',
            lastModified: new Date().toISOString(),
        };
        setNotes(prev => [newNote, ...prev]);
        setSelectedNoteId(newNote.id);
    };

    const handleUpdateNote = (field: keyof Note, value: string) => {
        setNotes(prev => prev.map(n =>
            n.id === selectedNoteId
                ? { ...n, [field]: value, lastModified: new Date().toISOString() }
                : n
        ));
    };

    const handleDeleteNote = (id: string) => {
        if (window.confirm("Are you sure you want to delete this note?")) {
            setNotes(prev => prev.filter(n => n.id !== id));
            if (selectedNoteId === id) {
                setSelectedNoteId(null);
            }
        }
    };
    
    const renderedContent = useMemo(() => {
        if (!selectedNote) return '';
        return marked.parse(selectedNote.content, { gfm: true, breaks: true, async: false }) as string;
    }, [selectedNote]);

    return (
        <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-800">
            <Header icon={<NotesIcon className="w-5 h-5"/>} title="Class Notes" />
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Notes List Pane */}
                <aside className="w-full md:w-1/3 md:max-w-sm flex flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold">Your Notes</h2>
                            <button onClick={handleAddNewNote} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><PlusIcon className="w-5 h-5"/></button>
                        </div>
                        <select
                            value={filterSubject}
                            onChange={e => setFilterSubject(e.target.value)}
                            className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500"
                        >
                            {subjects.map(s => <option key={s} value={s}>{s === 'all' ? 'All Subjects' : s}</option>)}
                        </select>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {filteredNotes.length > 0 ? filteredNotes.map(note => (
                            <div key={note.id} onClick={() => handleSelectNote(note.id)} className={`px-4 py-3 cursor-pointer border-l-4 ${selectedNoteId === note.id ? 'border-primary-500 bg-primary-50 dark:bg-gray-700/50' : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                <h3 className="font-semibold truncate">{note.title}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{note.subject} - {new Date(note.lastModified).toLocaleDateString()}</p>
                            </div>
                        )) : (
                            <p className="p-4 text-center text-gray-500">No notes found.</p>
                        )}
                    </div>
                </aside>

                {/* Editor Pane */}
                <main className="flex-1 flex flex-col">
                    {selectedNote ? (
                        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                            {/* Editor */}
                            <div className="w-full md:w-1/2 flex flex-col p-4 space-y-3">
                                <div className="flex items-center gap-4">
                                    <input type="text" value={selectedNote.title} onChange={e => handleUpdateNote('title', e.target.value)} className="text-2xl font-bold bg-transparent border-b-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-primary-500 flex-1"/>
                                    <button onClick={() => handleDeleteNote(selectedNote.id)} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><TrashIcon className="w-5 h-5"/></button>
                                </div>
                                <input type="text" value={selectedNote.subject} onChange={e => handleUpdateNote('subject', e.target.value)} placeholder="Subject" className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"/>
                                <textarea value={selectedNote.content} onChange={e => handleUpdateNote('content', e.target.value)} placeholder="Write your notes here using Markdown..." className="flex-1 w-full p-3 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 resize-none font-mono" />
                            </div>
                            {/* Preview */}
                            <div className="w-full md:w-1/2 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700">
                                <div className="prose prose-slate dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: renderedContent }} />
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-center text-gray-500">
                            <div>
                                <NotesIcon className="w-16 h-16 mx-auto mb-4 text-gray-400"/>
                                <h2 className="text-2xl font-semibold">Select a note to view or edit</h2>
                                <p>Or, create a new note to get started!</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default ClassNotes;