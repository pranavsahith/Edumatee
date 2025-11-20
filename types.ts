export type View = 'explainer' | 'summarizer' | 'quiz' | 'attendance' | 'notes' | 'reminders' | 'skills' | 'projects' | 'code-debugger' | 'interview-prep' | 'image-generator' | 'website-builder' | 'code-generator';

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  fileInfo?: {
    name: string;
    type: string;
  };
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface Subject {
    id:string;
    name: string;
    attended: number;
    total: number;
}

export interface Note {
    id: string;
    title: string;
    subject: string;
    content: string;
    lastModified: string;
}

export interface Reminder {
    id: string;
    title: string;
    dueDate: string;
    completed: boolean;
}

export interface SkillGoal {
    id: string;
    title: string;
    description: string;
    targetDate: string;
    status: 'In Progress' | 'Completed';
}

export interface Course {
    id: string;
    skillGoalId: string;
    title: string;
    platform: string;
    status: 'Not Started' | 'In Progress' | 'Completed';
    certificateImage?: string; // base64
}

export interface AIFeedback {
    badgeName: string;
    feedback: string;
    nextSteps: string[];
}

export interface Project {
    id: string;
    name: string;
    description: string;
    team: string; // Comma-separated names
}

export type TaskStatus = 'To Do' | 'In Progress' | 'Done';

export interface ProjectTask {
    id: string;
    projectId: string;
    title: string;
    assignedTo: string;
    status: TaskStatus;
}

export interface ProjectResource {
    id: string;
    projectId: string;
    name: string;
    type: 'link' | 'file';
    url?: string; // for links
    fileContent?: string; // for files (base64)
    fileName?: string;
    mimeType?: string;
}

export interface AIProjectIdea {
    title: string;
    description: string;
    keyFeatures: string[];
    techStack: string[];
    datasetSource?: string;
    architecture?: string;
    deploymentTips?: string;
}

export interface CodeDebugResult {
    language: string;
    errorAnalysis: string;
    suggestedFix: string;
    optimizedCode: string;
}

export interface WebsiteCode {
    html: string;
    css: string;
    js: string;
}
// FIX: Add AppCode interface
export interface AppCode {
    reactNative: { code: string; dependencies: string; };
    flutter: { code: string; dependencies: string; };
    swiftUI: { code: string; dependencies: string; };
    kotlin: { code: string; dependencies: string; };
    htmlPreview: string;
}
