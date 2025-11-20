
import { GoogleGenAI, GenerateContentResponse, Content, Part, Type } from "@google/genai";
import { Message, Note, QuizQuestion, AIFeedback, SkillGoal, AIProjectIdea, CodeDebugResult, WebsiteCode } from "../types";

const apiKey = process.env.API_KEY;
if (!apiKey) {
    console.error("API_KEY environment variable not set.");
}
const ai = new GoogleGenAI({ apiKey: apiKey || "" });

const buildHistory = (messages: Message[]): Content[] => {
    return messages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
    }));
};

const explainerSystemInstruction = `You are a friendly and brilliant AI academic assistant called EduLearn. Your role is to explain any academic or technical concept the user asks about. Use simple terms, examples, and analogies. Be encouraging and helpful. Where appropriate, provide visual diagrams using ASCII or Mermaid syntax, real-world examples to make the concept tangible, and ready-to-use code snippets in a suitable programming language. Format your responses using Markdown for readability.`;

export const generateExplanationStream = async (
    history: Message[],
    newMessage: string,
    file?: { data: string; mimeType: string },
    notes?: Note[]
): Promise<AsyncGenerator<GenerateContentResponse>> => {
    if (!apiKey) throw new Error("API key is missing.");

    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: { systemInstruction: explainerSystemInstruction },
        history: buildHistory(history)
    });
    
    let finalMessage = newMessage;
    if (notes && notes.length > 0) {
        const notesContext = notes.map(n => `Subject: ${n.subject}\nTitle: ${n.title}\nContent:\n${n.content}`).join('\n\n---\n\n');
        finalMessage = `Based on the following notes, please answer my question. If the answer is not in the notes, you can use your general knowledge but please mention that the information wasn't in the provided material.\n\n[My Notes]\n${notesContext}\n\n[My Question]\n${newMessage}`;
    }

    const parts: Part[] = [{ text: finalMessage }];
    if (file) {
        parts.push({ inlineData: { data: file.data, mimeType: file.mimeType } });
    }

    return chat.sendMessageStream({ message: parts });
};

export const summarizeText = async (
    textToSummarize: string,
    file?: { data: string; mimeType: string }
): Promise<string> => {
    if (!apiKey) throw new Error("API key is missing.");
    
    const model = 'gemini-2.5-flash';
    const prompt = "Please provide a concise summary of the following text/document. Focus on the key points and main ideas.";
    
    const parts: Part[] = [{ text: prompt }, { text: textToSummarize }];
     if (file) {
        parts.push({ inlineData: { data: file.data, mimeType: file.mimeType } });
    }

    const response = await ai.models.generateContent({
        model: model,
        contents: { parts }
    });
    
    return response.text;
};

const quizSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            question: {
                type: Type.STRING,
                description: "The question text."
            },
            options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "An array of 4 possible answers."
            },
            correctAnswer: {
                type: Type.STRING,
                description: "The correct answer from the options array."
            }
        },
        required: ["question", "options", "correctAnswer"]
    }
};

export const generateQuiz = async (topic: string): Promise<QuizQuestion[]> => {
    if (!apiKey) throw new Error("API key is missing.");

    const model = 'gemini-2.5-flash';
    const prompt = `Generate a 5-question multiple-choice quiz on the topic: "${topic}". Each question should have 4 options.`;
    
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: quizSchema,
        },
    });

    try {
        const jsonText = response.text.trim();
        const quizData = JSON.parse(jsonText);
        return quizData as QuizQuestion[];
    } catch (e) {
        console.error("Failed to parse quiz JSON:", e);
        console.error("Received text:", response.text);
        throw new Error("The AI returned an invalid quiz format. Please try again.");
    }
};

export const generateImages = async (
    prompt: string,
    numberOfImages: number,
    aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'
): Promise<string[]> => {
    if (!apiKey) throw new Error("API key is missing.");

    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
            numberOfImages,
            outputMimeType: 'image/png',
            aspectRatio,
        },
    });

    return response.generatedImages.map(img => img.image.imageBytes);
};

const skillFeedbackSchema = {
    type: Type.OBJECT,
    properties: {
        badgeName: {
            type: Type.STRING,
            description: "A creative and cool-sounding badge name for accomplishing the skill goal."
        },
        feedback: {
            type: Type.STRING,
            description: "Encouraging and constructive feedback about achieving this skill. Acknowledge their effort."
        },
        nextSteps: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of 3 concrete, actionable next steps to build upon this skill."
        }
    },
    required: ["badgeName", "feedback", "nextSteps"]
};

export const getSkillFeedback = async (goal: SkillGoal): Promise<AIFeedback> => {
    if (!apiKey) throw new Error("API key is missing.");

    const model = 'gemini-2.5-flash';
    const prompt = `Act as a helpful and motivating student advisor. A student has set a skill goal for themselves.
    Goal Title: "${goal.title}"
    Goal Description: "${goal.description}"
    
    Please provide a response in JSON format that includes a creative badge name for this achievement, some positive feedback, and three tangible next steps to continue their learning journey.`;
    
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: skillFeedbackSchema,
        },
    });

    try {
        const jsonText = response.text.trim();
        const feedbackData = JSON.parse(jsonText);
        return feedbackData as AIFeedback;
    } catch (e) {
        console.error("Failed to parse AI feedback JSON:", e);
        console.error("Received text:", response.text);
        throw new Error("The AI returned an invalid feedback format. Please try again.");
    }
};

const projectIdeaSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING, description: "A catchy and descriptive project title." },
            description: { type: Type.STRING, description: "A brief, one-paragraph description of the project." },
            keyFeatures: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "A list of 3-5 key features for the project."
            },
            techStack: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "A list of recommended technologies (e.g., 'React', 'Python', 'Firebase')."
            },
            datasetSource: { type: Type.STRING, description: "A suggested source for a dataset, like a specific Kaggle dataset or a public API." },
            architecture: { type: Type.STRING, description: "A brief overview of the proposed system architecture or ML model to use." },
            deploymentTips: { type: Type.STRING, description: "A tip or suggestion on how the project could be deployed or showcased." }
        },
        required: ["title", "description", "keyFeatures", "techStack", "datasetSource", "architecture", "deploymentTips"]
    }
};

export const getProjectIdeas = async (interests: string): Promise<AIProjectIdea[]> => {
    if (!apiKey) throw new Error("API key is missing.");

    const model = 'gemini-2.5-flash';
    const prompt = `I am a student looking for project ideas. My interests are: "${interests}". 
    Please generate 3 creative and achievable project ideas for a mini or major project. 
    For each idea, provide a title, a short description, 3-5 key features, a recommended tech stack, a suggested data source, a proposed architecture, and a deployment tip.`;
    
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: projectIdeaSchema,
        },
    });

    try {
        const jsonText = response.text.trim();
        const ideaData = JSON.parse(jsonText);
        return ideaData as AIProjectIdea[];
    } catch (e) {
        console.error("Failed to parse AI project ideas JSON:", e);
        console.error("Received text:", response.text);
        throw new Error("The AI returned an invalid project idea format. Please try again.");
    }
};

const codeDebugSchema = {
    type: Type.OBJECT,
    properties: {
        language: { type: Type.STRING, description: "The programming language detected in the code snippet." },
        errorAnalysis: { type: Type.STRING, description: "A detailed but easy-to-understand explanation of the error(s) in the code." },
        suggestedFix: { type: Type.STRING, description: "Specific advice on how to fix the code, explaining the logic behind the changes." },
        optimizedCode: { type: Type.STRING, description: "The complete, corrected, and potentially optimized version of the code snippet." }
    },
    required: ["language", "errorAnalysis", "suggestedFix", "optimizedCode"]
};

export const debugCode = async (code: string): Promise<CodeDebugResult> => {
    if (!apiKey) throw new Error("API key is missing.");

    const model = 'gemini-2.5-flash';
    const prompt = `Act as an expert code debugger. Analyze the following code snippet, identify any errors or potential issues, and provide a detailed analysis and a corrected version.
    
    Code to debug:
    \`\`\`
    ${code}
    \`\`\`
    `;
    
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: codeDebugSchema,
        },
    });

    try {
        const jsonText = response.text.trim();
        const debugData = JSON.parse(jsonText);
        return debugData as CodeDebugResult;
    } catch (e) {
        console.error("Failed to parse AI debug result JSON:", e);
        console.error("Received text:", response.text);
        throw new Error("The AI returned an invalid format. Please try again.");
    }
};

const interviewSystemInstruction = `You are "EduLearn," a friendly but professional AI Interview Coach for students in AI and Machine Learning. Your goal is to help users prepare for technical interviews. You can operate in a few modes:
1.  **Mock Interview (Theory)**: Ask the user common ML/AI theory questions (e.g., "What is overfitting?", "Explain the difference between classification and regression."). Wait for their answer, then provide constructive feedback and the ideal answer.
2.  **Resume Review**: Ask the user to paste their resume text. Provide actionable feedback on its content, structure, and how well it showcases their skills for an AI/ML role.
3.  **Behavioral Questions**: Ask common behavioral questions relevant to tech roles.

Start by greeting the user and asking them what they'd like to focus on today (e.g., theory, resume review, etc.). Conduct the conversation in a turn-by-turn manner.`;

export const startInterviewChat = async (
    history: Message[],
    newMessage: string
): Promise<AsyncGenerator<GenerateContentResponse>> => {
    if (!apiKey) throw new Error("API key is missing.");

    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: { systemInstruction: interviewSystemInstruction },
        history: buildHistory(history)
    });
    
    const parts: Part[] = [{ text: newMessage }];

    return chat.sendMessageStream({ message: parts });
};


export const generateCodeSnippetStream = async (
    prompt: string,
    language: string
): Promise<AsyncGenerator<GenerateContentResponse>> => {
    if (!apiKey) throw new Error("API key is missing.");
    const model = 'gemini-2.5-flash';
    const fullPrompt = `You are an expert code generator. Generate a code snippet in ${language} for the following task: "${prompt}". Provide a brief explanation of how the code works. Format your response in Markdown, with the code inside a correctly labeled code block.`;

    const response = await ai.models.generateContentStream({
        model,
        contents: fullPrompt,
    });
    return response;
};

const websiteCodeSchema = {
    type: Type.OBJECT,
    properties: {
        html: { type: Type.STRING, description: "The full HTML code for the website, including doctype, head, and body tags." },
        css: { type: Type.STRING, description: "The complete, self-contained CSS code for styling the website." },
        js: { type: Type.STRING, description: "The JavaScript code for any interactivity. Can be empty if not needed." }
    },
    required: ["html", "css", "js"]
};


export const generateWebsiteCode = async (prompt: string): Promise<WebsiteCode> => {
    if (!apiKey) throw new Error("API key is missing.");
    const model = 'gemini-2.5-flash';
    const fullPrompt = `Generate the complete HTML, CSS, and JavaScript code for a single-page website based on this description: "${prompt}". Provide the code in a single JSON object. The HTML should be a complete document, and the CSS should be self-contained. The JS should be placed in the body. Make the design modern and responsive.`;
    
    const response = await ai.models.generateContent({
        model,
        contents: fullPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: websiteCodeSchema,
        },
    });

    try {
        const jsonText = response.text.trim();
        const codeData = JSON.parse(jsonText);
        return codeData as WebsiteCode;
    } catch (e) {
        console.error("Failed to parse website code JSON:", e);
        console.error("Received text:", response.text);
        throw new Error("The AI returned an invalid code format. Please try again.");
    }
};
