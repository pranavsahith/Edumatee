import React, { useState, useEffect } from 'react';
import { generateCodeSnippetStream } from '../services/geminiService';
import { marked } from 'marked';
import { CodeGeneratorIcon, SpeakerIcon, StopIcon } from './icons';
import Header from './common/Header';
import { useSpeech } from '../hooks/useSpeech';

const CodeGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [language, setLanguage] = useState('python');
    const [generatedCode, setGeneratedCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { isSpeaking, speak, cancelSpeech } = useSpeech(() => {});

    useEffect(() => {
        return () => {
            cancelSpeech();
        }
    }, [cancelSpeech]);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a description of the code you want.');
            return;
        }
        setIsLoading(true);
        setError('');
        setGeneratedCode('');
        cancelSpeech();

        try {
            let fullResponse = '';
            const stream = await generateCodeSnippetStream(prompt, language);

            for await (const chunk of stream) {
                fullResponse += chunk.text;
                setGeneratedCode(fullResponse);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to generate code: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const renderedOutput = marked.parse(generatedCode, { gfm: true, breaks: true, async: false }) as string;

    const languages = ["Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust", "HTML", "CSS"];

    const handleToggleSpeech = () => {
        if (isSpeaking) {
            cancelSpeech();
        } else {
            // Speak the raw markdown content for a more natural reading flow
            speak(generatedCode);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-800">
            <Header icon={<CodeGeneratorIcon className="w-5 h-5"/>} title="AI Code Generator" />
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md mb-8 space-y-4">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe the code you need... (e.g., a function to reverse a string)"
                            className="w-full h-24 p-3 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 transition"
                            disabled={isLoading}
                        />
                        <div className="flex flex-col sm:flex-row gap-4 items-end">
                            <div className="w-full sm:w-1/3">
                                <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Language</label>
                                <select
                                    id="language"
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    className="mt-1 w-full p-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-primary-500"
                                >
                                    {languages.map(lang => <option key={lang} value={lang.toLowerCase()}>{lang}</option>)}
                                </select>
                            </div>
                            <button
                                onClick={handleGenerate}
                                disabled={isLoading}
                                className="w-full sm:w-auto px-6 py-2 h-10 text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:bg-gray-400 transition font-semibold"
                            >
                                {isLoading ? 'Generating...' : 'Generate Code'}
                            </button>
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                    
                    <div className="w-full border rounded-lg bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 min-h-[300px] flex flex-col">
                        <div className="flex justify-between items-center p-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                            <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-200">Generated Output</h3>
                            {generatedCode && !isLoading && (
                                <button
                                  onClick={handleToggleSpeech}
                                  className="p-1 text-gray-500 hover:text-primary-600"
                                  aria-label={isSpeaking ? "Stop reading" : "Read aloud"}
                                  title={isSpeaking ? "Stop reading" : "Read aloud"}
                                >
                                    {isSpeaking ? <StopIcon className="w-5 h-5" /> : <SpeakerIcon className="w-5 h-5" />}
                                </button>
                            )}
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            {isLoading && !generatedCode && (
                                <div className="flex items-center justify-center h-full">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                                </div>
                            )}
                            {generatedCode && (
                                 <div className="prose prose-slate dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: renderedOutput }} />
                            )}
                            {!isLoading && !generatedCode && !error && (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                                    <CodeGeneratorIcon className="w-12 h-12 mb-4"/>
                                    <p>Your generated code and explanation will appear here.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CodeGenerator;