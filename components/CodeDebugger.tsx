import React, { useState, useEffect } from 'react';
import { CodeDebugResult } from '../types';
import { debugCode } from '../services/geminiService';
import { CodeIcon, LogoIcon, SpeakerIcon, StopIcon } from './icons';
import Header from './common/Header';
import { marked } from 'marked';
import { useSpeech } from '../hooks/useSpeech';

const CodeDebugger: React.FC = () => {
    const [code, setCode] = useState('');
    const [result, setResult] = useState<CodeDebugResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { isSpeaking, speak, cancelSpeech } = useSpeech(() => {});

    useEffect(() => {
        return () => {
            cancelSpeech();
        }
    }, [cancelSpeech]);

    const handleDebug = async () => {
        if (!code.trim()) {
            setError('Please enter some code to debug.');
            return;
        }
        setIsLoading(true);
        setError('');
        setResult(null);
        cancelSpeech();
        try {
            const debugResult = await debugCode(code);
            setResult(debugResult);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to debug code: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleToggleSpeech = () => {
        if (!result) return;
        if (isSpeaking) {
            cancelSpeech();
        } else {
            const textToSpeak = `
                Error Analysis: ${result.errorAnalysis}.
                Suggested Fix: ${result.suggestedFix}.
                Corrected Code: ${result.optimizedCode}
            `;
            speak(textToSpeak);
        }
    };

    const renderMarkdown = (markdown: string) => {
        return marked.parse(markdown, { gfm: true, breaks: true, async: false }) as string;
    };

    return (
        <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-800">
            <Header icon={<CodeIcon className="w-5 h-5"/>} title="Smart Code Debugger" />
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Input Column */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Your Code</h2>
                        <textarea
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Paste your Python, JavaScript, etc. code here..."
                            className="w-full h-96 p-3 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition font-mono text-sm"
                            disabled={isLoading}
                        />
                        <div className="flex justify-end">
                            <button
                                onClick={handleDebug}
                                disabled={isLoading}
                                className="px-6 py-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-semibold flex items-center gap-2"
                            >
                                <LogoIcon className="w-5 h-5"/>
                                <span>{isLoading ? 'Debugging...' : 'Debug with AI'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Output Column */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">AI Analysis</h2>
                            {result && !isLoading && (
                                <button onClick={handleToggleSpeech} className="p-1 text-gray-500 hover:text-primary-600">
                                    {isSpeaking ? <StopIcon className="w-5 h-5" /> : <SpeakerIcon className="w-5 h-5" />}
                                </button>
                            )}
                        </div>
                        <div className="w-full h-full min-h-96 p-4 border rounded-lg bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                           {isLoading && (
                                <div className="flex items-center justify-center h-full">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                                </div>
                            )}
                            {error && <p className="text-red-500">{error}</p>}
                            {result && !isLoading && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="font-bold text-md text-primary-600 dark:text-primary-400">Language Detected</h3>
                                        <p className="text-sm font-semibold p-2 bg-gray-100 dark:bg-gray-800 rounded-md inline-block">{result.language}</p>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-md text-primary-600 dark:text-primary-400">Error Analysis</h3>
                                        <div className="prose prose-sm prose-slate dark:prose-invert max-w-none mt-1" dangerouslySetInnerHTML={{ __html: renderMarkdown(result.errorAnalysis) }} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-md text-primary-600 dark:text-primary-400">Suggested Fix</h3>
                                         <div className="prose prose-sm prose-slate dark:prose-invert max-w-none mt-1" dangerouslySetInnerHTML={{ __html: renderMarkdown(result.suggestedFix) }} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-md text-primary-600 dark:text-primary-400">Corrected Code</h3>
                                        <div className="prose prose-sm prose-slate dark:prose-invert max-w-none mt-1 bg-gray-100 dark:bg-black/20 p-1 rounded-md">
                                            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(`\`\`\`${result.language.toLowerCase()}\n${result.optimizedCode}\n\`\`\``) }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                            {!result && !isLoading && !error && (
                                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
                                    <CodeIcon className="w-12 h-12 mb-4"/>
                                    <p>Your code analysis will appear here.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CodeDebugger;
