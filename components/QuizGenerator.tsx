import React, { useState, useEffect } from 'react';
import { QuizQuestion } from '../types';
import { generateQuiz } from '../services/geminiService';
import { QuizIcon, CheckCircleIcon, XCircleIcon, SpeakerIcon, StopIcon } from './icons';
import Header from './common/Header';
import { useSpeech } from '../hooks/useSpeech';

const QuizGenerator: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { isSpeaking, speak, cancelSpeech } = useSpeech(() => {});
  const [speakingQuestionIndex, setSpeakingQuestionIndex] = useState<number | null>(null);

  useEffect(() => {
    return () => {
        cancelSpeech();
    }
  }, [cancelSpeech]);

  useEffect(() => {
    if(!isSpeaking) {
        setSpeakingQuestionIndex(null);
    }
  }, [isSpeaking]);

  const handleGenerateQuiz = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic.');
      return;
    }
    setIsLoading(true);
    setError('');
    setQuestions([]);
    setUserAnswers({});
    setSubmitted(false);
    setScore(0);
    cancelSpeech();
    try {
      const result = await generateQuiz(topic);
      setQuestions(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate quiz: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setUserAnswers({
      ...userAnswers,
      [questionIndex]: answer,
    });
  };

  const handleSubmitQuiz = () => {
    let newScore = 0;
    questions.forEach((q, index) => {
      if (userAnswers[index] === q.correctAnswer) {
        newScore++;
      }
    });
    setScore(newScore);
    setSubmitted(true);
    cancelSpeech();
  };
  
  const getOptionClass = (qIndex: number, option: string) => {
    if (!submitted) return 'hover:bg-primary-100 dark:hover:bg-primary-900';
    const question = questions[qIndex];
    const isCorrect = option === question.correctAnswer;
    const isSelected = userAnswers[qIndex] === option;

    if (isCorrect) return 'bg-green-100 dark:bg-green-900/50 border-green-500';
    if (isSelected && !isCorrect) return 'bg-red-100 dark:bg-red-900/50 border-red-500';
    return 'border-gray-300 dark:border-gray-600';
  };
  
  const handleToggleSpeech = (qIndex: number, text: string) => {
      if(speakingQuestionIndex === qIndex) {
          cancelSpeech();
      } else {
          speak(text);
          setSpeakingQuestionIndex(qIndex);
      }
  };


  return (
    <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-800">
      <Header icon={<QuizIcon className="w-5 h-5"/>} title="Quiz Generator" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter a topic (e.g., 'React Hooks')"
              className="flex-1 p-3 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
              disabled={isLoading}
            />
            <button
              onClick={handleGenerateQuiz}
              disabled={isLoading}
              className="px-6 py-3 text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-semibold"
            >
              {isLoading ? 'Generating...' : 'Generate Quiz'}
            </button>
          </div>

          {error && <p className="text-red-500 text-center">{error}</p>}
          
          {isLoading && (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          )}

          {questions.length > 0 && (
            <div className="space-y-6">
              {questions.map((q, qIndex) => (
                <div key={qIndex} className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-start">
                    <p className="font-semibold text-lg mb-4 flex-1">{qIndex + 1}. {q.question}</p>
                    <button onClick={() => handleToggleSpeech(qIndex, q.question)} className="p-1 text-gray-500 hover:text-primary-600">
                        {speakingQuestionIndex === qIndex ? <StopIcon className="w-5 h-5" /> : <SpeakerIcon className="w-5 h-5" />}
                    </button>
                  </div>
                  <div className="space-y-3">
                    {q.options.map((option, oIndex) => (
                      <label key={oIndex} className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${getOptionClass(qIndex, option)}`}>
                        <input
                          type="radio"
                          name={`question-${qIndex}`}
                          value={option}
                          checked={userAnswers[qIndex] === option}
                          onChange={() => handleAnswerChange(qIndex, option)}
                          disabled={submitted}
                          className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <span className="ml-3">{option}</span>
                        {submitted && userAnswers[qIndex] === option && option === q.correctAnswer && <CheckCircleIcon className="ml-auto h-5 w-5 text-green-600"/>}
                        {submitted && userAnswers[qIndex] === option && option !== q.correctAnswer && <XCircleIcon className="ml-auto h-5 w-5 text-red-600"/>}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <div className="text-center">
                {!submitted ? (
                  <button onClick={handleSubmitQuiz} className="px-8 py-3 text-white bg-green-600 rounded-lg hover:bg-green-700 font-bold">
                    Submit Quiz
                  </button>
                ) : (
                  <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
                    <h3 className="text-2xl font-bold">Quiz Complete!</h3>
                    <p className="text-xl mt-2">Your Score: <span className="font-bold text-primary-600">{score}</span> / {questions.length}</p>
                    <button onClick={handleGenerateQuiz} disabled={isLoading} className="mt-4 px-6 py-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700">
                      Try another topic
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizGenerator;
