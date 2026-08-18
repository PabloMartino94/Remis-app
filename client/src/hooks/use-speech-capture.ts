import { useState, useCallback, useRef, useEffect } from 'react';

interface SpeechCaptureResult {
  transcript: string;
  isListening: boolean;
  error: string | null;
  isSupported: boolean;
  start: () => void;
  stop: () => void;
}

export function useSpeechCapture(): SpeechCaptureResult {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'es-AR';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const result = event.results[0][0].transcript;
      setTranscript(result);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      let errorMessage: string | null = 'Error de reconocimiento de voz';
      switch (event.error) {
        case 'not-allowed':
        case 'permission-denied':
          errorMessage = 'Permiso de micrófono denegado';
          break;
        case 'no-speech':
          errorMessage = 'No se detectó voz';
          break;
        case 'network':
          errorMessage = 'Error de red';
          break;
        case 'aborted':
          errorMessage = null;
          break;
      }
      if (errorMessage) {
        setError(errorMessage);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [isSupported]);

  const start = useCallback(() => {
    if (!isSupported) {
      setError('Tu navegador no soporta reconocimiento de voz');
      return;
    }

    setError(null);
    setTranscript('');
    setIsListening(true);

    try {
      recognitionRef.current?.start();
    } catch (e) {
      setError('Error al iniciar el micrófono');
      setIsListening(false);
    }
  }, [isSupported]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return {
    transcript,
    isListening,
    error,
    isSupported,
    start,
    stop,
  };
}
