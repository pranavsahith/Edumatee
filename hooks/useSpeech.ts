import { useState, useRef, useEffect } from 'react';

const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const useSpeech = (onTranscript: (text: string) => void) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any | null>(null);

  useEffect(() => {
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      const recognition = recognitionRef.current;
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result) => result.transcript)
          .join('');
        onTranscript(transcript);
      };

      recognition.onend = () => {
        if (isListening) {
          recognition.start(); // Restart if it stops automatically
        }
      };
    }
    
    // Cleanup speech synthesis on component unmount
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isListening, onTranscript]);
  
  // --- Speech Recognition ---
  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error("Speech recognition could not start.", error);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  // --- Speech Synthesis ---
  const speak = (text: string) => {
    if (!window.speechSynthesis || !text) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
        console.error("Speech synthesis error.");
        setIsSpeaking(false);
    };

    // Always cancel any ongoing speech before starting a new one.
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const cancelSpeech = () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
  };


  const isSpeechSupported = !!SpeechRecognition && !!window.speechSynthesis;

  return { isListening, isSpeaking, startListening, stopListening, speak, cancelSpeech, isSpeechSupported };
};
