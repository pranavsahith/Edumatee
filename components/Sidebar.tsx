
import React from 'react';
import { LogoIcon, UserIcon, ExplainIcon, SummarizeIcon, QuizIcon, AttendanceIcon, NotesIcon, BellIcon, TrophyIcon, ProjectIcon, CodeIcon, InterviewIcon, ImageIcon, LogoutIcon, WebsiteBuilderIcon, CodeGeneratorIcon } from './icons';
import { View } from '../types';

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onLogout: () => void;
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  view: View;
  activeView: View;
  onClick: (view: View) => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, view, activeView, onClick }) => (
  <button
    onClick={() => onClick(view)}
    className={`flex items-center w-full px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
      activeView === view
        ? 'bg-primary-600 text-white'
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`}
  >
    {icon}
    <span className="ml-3">{label}</span>
  </button>
);

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isOpen, setIsOpen, onLogout }) => {
  const handleViewChange = (view: View) => {
    setActiveView(view);
    // On mobile, close the sidebar after selecting an item
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  const navGroups = [
    {
      title: 'Core Learning',
      items: [
        { view: 'explainer' as View, label: 'AI Explainer', icon: <ExplainIcon className="h-5 w-5" /> },
        { view: 'summarizer' as View, label: 'Text Summarizer', icon: <SummarizeIcon className="h-5 w-5" /> },
        { view: 'quiz' as View, label: 'Quiz Generator', icon: <QuizIcon className="h-5 w-5" /> },
      ]
    },
    {
      title: 'Creative & Development',
      items: [
        { view: 'image-generator' as View, label: 'Image Generator', icon: <ImageIcon className="h-5 w-5" /> },
        { view: 'code-generator' as View, label: 'Code Generator', icon: <CodeGeneratorIcon className="h-5 w-5" /> },
        { view: 'website-builder' as View, label: 'Website Builder', icon: <WebsiteBuilderIcon className="h-5 w-5" /> },
        { view: 'code-debugger' as View, label: 'Code Debugger', icon: <CodeIcon className="h-5 w-5" /> },
      ]
    },
    {
        title: 'Career Prep',
        items: [
            { view: 'interview-prep' as View, label: 'Interview Prep', icon: <InterviewIcon className="h-5 w-5" /> },
            { view: 'skills' as View, label: 'Skill Tracker', icon: <TrophyIcon className="h-5 w-5" /> },
            { view: 'projects' as View, label: 'Project Planner', icon: <ProjectIcon className="h-5 w-5" /> },
        ]
    },
    {
        title: 'Productivity',
        items: [
            { view: 'notes' as View, label: 'Class Notes', icon: <NotesIcon className="h-5 w-5" /> },
            { view: 'reminders' as View, label: 'Reminders', icon: <BellIcon className="h-5 w-5" /> },
            { view: 'attendance' as View, label: 'Attendance Tracker', icon: <AttendanceIcon className="h-5 w-5" /> },
        ]
    }
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className={`fixed inset-0 bg-black/60 z-30 md:hidden transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      ></div>

      <aside
        className={`flex flex-col w-64 p-3 bg-gray-800 text-white shrink-0 fixed md:relative h-full z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="p-2 mb-5">
          <div className="flex items-center">
            <LogoIcon className="h-8 w-8 text-primary-500" />
            <h1 className="ml-2 text-xl font-bold">EduLearn</h1>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto">
          {navGroups.map((group, index) => (
            <div key={group.title} className={index > 0 ? 'mt-4' : ''}>
              <h3 className="px-3 py-2 text-xs font-semibold uppercase text-gray-400 tracking-wider">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map(item => (
                  <NavItem
                    key={item.view}
                    icon={item.icon}
                    label={item.label}
                    view={item.view}
                    activeView={activeView}
                    onClick={handleViewChange}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-auto border-t border-gray-700 -mx-3">
          <button onClick={onLogout} className="flex items-center w-full px-4 py-3 hover:bg-gray-700 transition-colors">
            <UserIcon className="h-6 w-6 rounded-full bg-primary-500 p-1" />
            <span className="ml-3 font-medium">Student</span>
            <LogoutIcon className="ml-auto h-5 w-5 text-gray-400" />
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
