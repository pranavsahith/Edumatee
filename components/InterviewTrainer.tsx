import React, { useState, useEffect, useRef } from 'react';
import { Message } from '../types';
import { startInterviewChat } from '../services/geminiService';
import { marked } from 'marked';
import { LogoIcon, SendIcon, MicrophoneIcon, StopCircleIcon, SpeakerIcon, StopIcon } from './icons';
import Header from './common/Header';
import { InterviewIcon } from './icons';
import { useSpeech } from '../hooks/useSpeech';

const InterviewTrainer: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { isListening, startListening, stopListening, isSpeechSupported, isSpeaking, speak, cancelSpeech } = useSpeech(
      (transcript) => setInput(transcript)
    );
    const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

    // Initial greeting from the AI
    useEffect(() => {
        setMessages([{
            id: `msg-init-${Date.now()}`,
            role: 'model',
            content: `Hello! I'm EduLearn, your AI Interview Coach. I can help you with theory questions, resume reviews, or behavioral questions. What would you like to focus on today?`
        }]);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [input]);

    useEffect(() => {
        if(!isSpeaking) {
            setSpeakingMessageId(null);
        }
    }, [isSpeaking]);

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;

        if (isListening) stopListening();
        cancelSpeech();

        const userMessage: Message = { id: `msg-${Date.now()}`, role: 'user', content: input };
        const modelMessage: Message = { id: `msg-${Date.now()}-model`, role: 'model', content: '' };
        
        setMessages(prev => [...prev, userMessage, modelMessage]);
        setInput('');
        setIsLoading(true);

        try {
            let fullResponse = '';
            // Pass the current conversation history to the service
            const stream = await startInterviewChat(messages, input);

            for await (const chunk of stream) {
                fullResponse += chunk.text;
                setMessages(prev => prev.map(m => m.id === modelMessage.id ? { ...m, content: fullResponse } : m));
            }
        } catch (err) {
            console.error(err);
            const errorContent = err instanceof Error ? err.message : 'Sorry, an unknown error occurred.';
            setMessages(prev => prev.map(m => m.id === modelMessage.id ? { ...m, content: `**Error:** ${errorContent}` } : m));
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleSpeech = (msg: Message) => {
        if(speakingMessageId === msg.id) {
            cancelSpeech();
        } else {
            speak(msg.content);
            setSpeakingMessageId(msg.id);
        }
    };

    const renderMessageContent = (msg: Message) => {
        const html = marked.parse(msg.content, { gfm: true, breaks: true, async: false }) as string;
        return <div className="prose prose-slate dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: html }} />;
    };

    return (
        <div className="relative flex flex-col h-full bg-gray-100 dark:bg-gray-800">
            <Header icon={<InterviewIcon className="w-5 h-5"/>} title="AI Interview Trainer" />
            <div className="flex-1 overflow-y-auto pb-36">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                    {messages.map((msg) => (
                        <div key={msg.id} className="flex items-start gap-4 group">
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${msg.role === 'user' ? 'bg-primary-500' : 'bg-gray-600'}`}>
                                {msg.role === 'user' ? 'U' : <LogoIcon className="w-5 h-5" />}
                            </div>
                            <div className="flex-1 pt-1 min-w-0">
                                {renderMessageContent(msg)}
                                {isLoading && msg.role === 'model' && messages[messages.length - 1].id === msg.id && <span className="inline-block w-3 h-3 ml-2 bg-gray-500 rounded-full animate-pulse"></span>}
                            </div>
                             {msg.role === 'model' && msg.content && !isLoading && (
                                <button onClick={() => handleToggleSpeech(msg)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-500 hover:text-primary-600">
                                    {speakingMessageId === msg.id ? <StopIcon className="w-5 h-5" /> : <SpeakerIcon className="w-5 h-5" />}
                                </button>
                            )}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            
            <div className="absolute bottom-0 left-0 w-full bg-transparent dark:bg-transparent from-gray-100 dark:from-gray-800 bg-gradient-to-t pointer-events-none h-32"></div>
            <div className="absolute bottom-0 left-0 w-full p-4">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white dark:bg-gray-700/50 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex items-end p-2">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                            placeholder="Your response..."
                            className="flex-1 bg-transparent border-none focus:ring-0 resize-none p-2 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 max-h-48"
                            rows={1}
                            disabled={isLoading}
                        />
                        {isSpeechSupported && (
                            <button onClick={isListening ? stopListening : startListening} className="p-2 rounded-full text-gray-500 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors" aria-label="Use microphone">
                                {isListening ? <StopCircleIcon className="h-5 w-5 text-red-500 animate-pulse" /> : <MicrophoneIcon className="h-5 w-5" />}
                            </button>
                        )}
                        <button onClick={handleSendMessage} disabled={isLoading || !input.trim()} className="p-2 rounded-full bg-primary-600 text-white hover:bg-primary-700 disabled:bg-gray-400 dark:disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors ml-2" aria-label="Send message">
                            <SendIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InterviewTrainer;