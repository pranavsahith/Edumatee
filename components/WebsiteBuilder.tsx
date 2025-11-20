import React, { useState, useEffect } from 'react';
import { WebsiteCode } from '../types';
import { generateWebsiteCode } from '../services/geminiService';
import { WebsiteBuilderIcon } from './icons';
import Header from './common/Header';

type CodeTab = 'html' | 'css' | 'js';

const WebsiteBuilder: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [result, setResult] = useState<WebsiteCode | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<CodeTab>('html');
    const [iframeContent, setIframeContent] = useState('');
    const [copySuccess, setCopySuccess] = useState('');

    useEffect(() => {
        if (result) {
            const content = `
                <html>
                    <head>
                        <style>${result.css}</style>
                    </head>
                    <body>
                        ${result.html}
                        <script>${result.js}</script>
                    </body>
                </html>
            `;
            setIframeContent(content);
        }
    }, [result]);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please describe the website you want to build.');
            return;
        }
        setIsLoading(true);
        setError('');
        setResult(null);
        try {
            const codeResult = await generateWebsiteCode(prompt);
            setResult(codeResult);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to generate website: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCopy = (content: string) => {
        navigator.clipboard.writeText(content);
        setCopySuccess(`Copied ${activeTab.toUpperCase()}!`);
        setTimeout(() => setCopySuccess(''), 2000);
    };

    return (
        <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-800">
            <Header icon={<WebsiteBuilderIcon className="w-5 h-5"/>} title="AI Website Builder" />
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="max-w-7xl mx-auto bg-white dark:bg-gray-900 p-4 rounded-lg shadow-md">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe your website... (e.g., a portfolio page for a photographer with a gallery and contact form)"
                        className="w-full h-20 p-3 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 transition"
                        disabled={isLoading}
                    />
                    <div className="flex justify-end mt-2">
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading}
                            className="px-6 py-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:bg-gray-400 transition font-semibold"
                        >
                            {isLoading ? 'Building...' : 'Build Website'}
                        </button>
                    </div>
                </div>
                
                 {error && <p className="text-red-500 text-center">{error}</p>}

                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
                    {/* Code Editor Side */}
                    <div className="flex flex-col bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden">
                        <div className="flex border-b border-gray-200 dark:border-gray-700">
                            <button onClick={() => setActiveTab('html')} className={`px-4 py-2 font-semibold ${activeTab === 'html' ? 'bg-primary-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>HTML</button>
                            <button onClick={() => setActiveTab('css')} className={`px-4 py-2 font-semibold ${activeTab === 'css' ? 'bg-primary-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>CSS</button>
                            <button onClick={() => setActiveTab('js')} className={`px-4 py-2 font-semibold ${activeTab === 'js' ? 'bg-primary-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>JS</button>
                            <div className="flex-grow"></div>
                            {result && (
                                <button onClick={() => handleCopy(result[activeTab])} className="px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800">
                                    {copySuccess || 'Copy'}
                                </button>
                            )}
                        </div>
                        <div className="flex-1 relative">
                            <textarea
                                readOnly
                                value={(result && result[activeTab]) || ''}
                                className="w-full h-full p-3 font-mono text-sm bg-gray-50 dark:bg-gray-800 border-none resize-none absolute"
                                placeholder={`Your ${activeTab.toUpperCase()} code will appear here...`}
                            />
                        </div>
                    </div>

                    {/* Preview Side */}
                    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md flex flex-col">
                        <div className="p-2 border-b border-gray-200 dark:border-gray-700 text-center font-semibold">Live Preview</div>
                        {isLoading && <div className="flex-1 flex justify-center items-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>}
                        {!isLoading && result && <iframe srcDoc={iframeContent} title="Website Preview" className="w-full flex-1 border-0" />}
                        {!isLoading && !result && (
                             <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                                <WebsiteBuilderIcon className="w-12 h-12 mb-4"/>
                                <p>Your website preview will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WebsiteBuilder;