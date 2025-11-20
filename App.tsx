
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import { View } from './types';

import Explainer from './components/Explainer';
import Summarizer from './components/Summarizer';
import QuizGenerator from './components/QuizGenerator';
import AttendanceTracker from './components/AttendanceTracker';
import ClassNotes from './components/ClassNotes';
import Reminders from './components/Reminders';
import SkillTracker from './components/SkillTracker';
import ProjectPlanner from './components/ProjectPlanner';
import CodeDebugger from './components/CodeDebugger';
import InterviewTrainer from './components/InterviewTrainer';
import ImageGenerator from './components/ImageGenerator';
import Login from './components/Login';
import { ThreeDotsIcon, LogoIcon } from './components/icons';
import useLocalStorage from './hooks/useLocalStorage';
import WebsiteBuilder from './components/WebsiteBuilder';
import CodeGenerator from './components/CodeGenerator';


const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('explainer');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useLocalStorage('isAuthenticated', false);

  const handleLogin = () => {
    setIsAuthenticated(true);
    setActiveView('explainer');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeView) {
      case 'explainer':
        return <Explainer />;
      case 'summarizer':
        return <Summarizer />;
      case 'quiz':
        return <QuizGenerator />;
      case 'image-generator':
        return <ImageGenerator />;
      case 'code-generator':
        return <CodeGenerator />;
      case 'website-builder':
        return <WebsiteBuilder />;
      case 'attendance':
        return <AttendanceTracker />;
      case 'notes':
        return <ClassNotes />;
      case 'reminders':
        return <Reminders />;
      case 'skills':
        return <SkillTracker />;
      case 'projects':
        return <ProjectPlanner />;
      case 'code-debugger':
        return <CodeDebugger />;
      case 'interview-prep':
        return <InterviewTrainer />;
      default:
        return <Explainer />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-slate-800 dark:text-slate-200">
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        isOpen={isSidebarOpen}
        setIsOpen={setSidebarOpen}
        onLogout={handleLogout}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600 dark:text-gray-300 p-2">
            <ThreeDotsIcon className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-2">
            <LogoIcon className="h-6 w-6 text-primary-500" />
            <h1 className="text-lg font-bold">EduLearn</h1>
          </div>
          <div className="w-8"></div> {/* Spacer to balance the title */}
        </div>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
