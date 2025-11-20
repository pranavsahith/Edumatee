import React, { useState, useRef, useEffect } from 'react';
import { SummarizeIcon, PaperclipIcon, SpeakerIcon, StopIcon } from './icons';
import { summarizeText } from '../services/geminiService';
import { readFileAsBase64 } from '../utils/fileUtils';
import { marked } from 'marked';
import Header from './common/Header';
import { useSpeech } from '../hooks/useSpeech';

const Summarizer: React.FC = () => {
    const [inputText, setInputText] = useState('');
    const [summary, setSummary] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { isSpeaking, speak, cancelSpeech } = useSpeech(() => {});
    
    useEffect(() => {
        return () => {
            cancelSpeech();
        }
    }, [cancelSpeech]);

    const handleSummarize = async () => {
        if (!inputText.trim() && !selectedFile) {
            setError('Please enter some text or upload a file to summarize.');
            return;
        }
        setIsLoading(true);
        setError('');
        setSummary('');
        cancelSpeech();

        let fileData: { data: string; mimeType: string } | undefined;
        if (selectedFile) {
            try {
                const base64Data = await readFileAsBase64(selectedFile);
                fileData = { data: base64Data, mimeType: selectedFile.type };
            } catch (e) {
                setError('Failed to read the uploaded file.');
                setIsLoading(false);
                return;
            }
        }

        try {
            const result = await summarizeText(inputText, fileData);
            setSummary(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to generate summary: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
            setError('');
        }
    };
    
    const handleToggleSpeech = () => {
        if (isSpeaking) {
            cancelSpeech();
        } else {
            speak(summary);
        }
    };

    const renderedSummary = marked.parse(summary, { gfm: true, breaks: true, async: false }) as string;

    return (
        <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-800">
            <Header icon={<SummarizeIcon className="w-5 h-5"/>} title="Text Summarizer" />
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Input Column */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Your Content</h2>
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Paste your text here..."
                            className="w-full h-64 p-3 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                            disabled={isLoading}
                        />
                        <div className="flex items-center justify-between gap-4">
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".txt,.md,.pdf" />
                            <button onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                                <PaperclipIcon className="w-4 h-4" />
                                <span>{selectedFile ? 'Change File' : 'Upload File'}</span>
                            </button>
                             <button
                                onClick={handleSummarize}
                                disabled={isLoading}
                                className="px-6 py-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-semibold"
                            >
                                {isLoading ? 'Summarizing...' : 'Summarize'}
                            </button>
                        </div>
                         {selectedFile && <p className="text-sm text-gray-500 dark:text-gray-400">Selected file: {selectedFile.name}</p>}
                    </div>

                    {/* Output Column */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">AI Summary</h2>
                             {summary && !isLoading && (
                                <button onClick={handleToggleSpeech} className="p-1 text-gray-500 hover:text-primary-600">
                                    {isSpeaking ? <StopIcon className="w-5 h-5" /> : <SpeakerIcon className="w-5 h-5" />}
                                </button>
                            )}
                        </div>
                        <div className="w-full h-full min-h-64 p-4 border rounded-lg bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                           {isLoading && (
                                <div className="flex items-center justify-center h-full">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                                </div>
                            )}
                            {error && <p className="text-red-500">{error}</p>}
                            {summary && !isLoading && (
                                <div className="prose prose-slate dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: renderedSummary }} />
                            )}
                            {!summary && !isLoading && !error && (
                                <p className="text-gray-500 dark:text-gray-400">Your summary will appear here.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Summarizer;
