import React, { useState, useEffect, useRef } from 'react';
import { Message, Note } from '../types';
import { generateExplanationStream } from '../services/geminiService';
import { marked } from 'marked';
import { ExplainIcon, LogoIcon, PaperclipIcon, SendIcon, NotesIcon, MicrophoneIcon, SpeakerIcon, StopCircleIcon, StopIcon } from './icons';
import { readFileAsBase64 } from '../utils/fileUtils';
import Header from './common/Header';
import useLocalStorage from '../hooks/useLocalStorage';
import { useSpeech } from '../hooks/useSpeech';

const ChatInput: React.FC<{
  onSendMessage: (text: string, file?: File, searchNotes?: boolean) => void;
  isLoading: boolean;
}> = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchInNotes, setSearchInNotes] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isListening, startListening, stopListening, isSpeechSupported } = useSpeech(
    (transcript) => {
        setText(transcript);
    }
  );

  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  const handleSend = () => {
    if ((text.trim() || selectedFile) && !isLoading) {
      onSendMessage(text, selectedFile || undefined, searchInNotes);
      setText('');
      setSelectedFile(null);
      if(isListening) stopListening();
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="bg-white dark:bg-gray-700/50 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col p-2">
       {selectedFile && (
        <div className="flex items-center justify-between px-2 pt-1 pb-2 text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-200 truncate">{selectedFile.name}</span>
            <button onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="font-bold text-gray-500 hover:text-gray-800 dark:hover:text-white" aria-label="Remove file">&times;</button>
        </div>
      )}
      <div className="flex items-end">
        <input type="file" ref={fileInputRef} onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} className="hidden" />
        <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-full text-gray-500 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors" aria-label="Attach file"><PaperclipIcon className="h-5 w-5" /></button>
        <textarea ref={textareaRef} value={text} onChange={(e) => setText(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} placeholder="Ask about a topic..." className="flex-1 bg-transparent border-none focus:ring-0 resize-none p-2 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 max-h-48" rows={1} disabled={isLoading} />
        {isSpeechSupported && (
            <button onClick={isListening ? stopListening : startListening} className="p-2 rounded-full text-gray-500 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors" aria-label="Use microphone">
                {isListening ? <StopCircleIcon className="h-5 w-5 text-red-500 animate-pulse" /> : <MicrophoneIcon className="h-5 w-5" />}
            </button>
        )}
        <button onClick={handleSend} disabled={isLoading || (!text.trim() && !selectedFile)} className="p-2 rounded-full bg-primary-600 text-white hover:bg-primary-700 disabled:bg-gray-400 dark:disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors ml-2" aria-label="Send message"><SendIcon className="h-5 w-5" /></button>
      </div>
       <div className="flex items-center justify-end pt-2 pr-2">
        <label htmlFor="search-notes-toggle" className="flex items-center cursor-pointer">
            <span className="mr-2 text-xs font-medium text-gray-600 dark:text-gray-300">Search in my notes</span>
            <div className="relative">
                <input type="checkbox" id="search-notes-toggle" className="sr-only" checked={searchInNotes} onChange={() => setSearchInNotes(!searchInNotes)} />
                <div className={`block w-10 h-6 rounded-full transition ${searchInNotes ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${searchInNotes ? 'transform translate-x-4' : ''}`}></div>
            </div>
        </label>
      </div>
    </div>
  );
};

const Explainer: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notes] = useLocalStorage<Note[]>('class-notes', []);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isSpeaking, speak, cancelSpeech } = useSpeech(() => {});
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  useEffect(() => {
      if(!isSpeaking) {
          setSpeakingMessageId(null);
      }
  }, [isSpeaking]);

  const handleSendMessage = async (text: string, file?: File, searchNotes?: boolean) => {
    setIsLoading(true);
    cancelSpeech();
    let fileData: { data: string; mimeType: string } | undefined;
    if (file) {
      const base64Data = await readFileAsBase64(file);
      fileData = { data: base64Data, mimeType: file.type };
    }
    
    const userMessage: Message = { id: `msg-${Date.now()}`, role: 'user', content: text, ...(file && { fileInfo: { name: file.name, type: file.type } }) };
    const modelMessage: Message = { id: `msg-${Date.now()}-model`, role: 'model', content: '' };
    
    setMessages(prev => [...prev, userMessage, modelMessage]);

    try {
      let fullResponse = '';
      const notesToSearch = searchNotes ? notes : undefined;
      const stream = await generateExplanationStream(messages, text, fileData, notesToSearch);

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
    return (
        <div className="prose prose-slate dark:prose-invert max-w-none">
            {msg.fileInfo && <div className="flex items-center gap-2 p-2 mb-2 rounded-lg bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"><PaperclipIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" /><span className="text-sm font-medium">{msg.fileInfo.name}</span></div>}
            <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full bg-gray-100 dark:bg-gray-800">
      <Header icon={<ExplainIcon className="w-5 h-5"/>} title="AI Topic Explainer" />
      <div className="flex-1 overflow-y-auto pb-36">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center pt-20">
                <LogoIcon className="w-16 h-16 text-primary-500 mb-4" />
                <h1 className="text-4xl font-bold text-gray-800 dark:text-white">Ask Me Anything!</h1>
                <p className="mt-2 text-gray-600 dark:text-gray-300">I can explain complex topics, concepts, or terms.</p>
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <NotesIcon className="w-5 h-5"/>
                    <span>Use the toggle below to search within your notes!</span>
                </div>
            </div>
            ) : (
            <div className="py-8 space-y-6">
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
            )}
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 w-full bg-transparent dark:bg-transparent from-gray-100 dark:from-gray-800 bg-gradient-to-t pointer-events-none h-32"></div>
      <div className="absolute bottom-0 left-0 w-full p-4">
        <div className="max-w-4xl mx-auto"><ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} /></div>
      </div>
    </div>
  );
};

export default Explainer;
