import { useState, useCallback, useRef, useEffect } from 'react';

interface UseSpeechRecognitionReturn {
    isListening: boolean;
    transcript: string;
    interimTranscript: string;
    startListening: () => void;
    stopListening: () => void;
    error: string | null;
    isSupported: boolean;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const shouldRestartRef = useRef(false);

    const isSupported = typeof window !== 'undefined' &&
        ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

    const createRecognition = useCallback(() => {
        if (!isSupported) return;

        // Cleanup existing
        if (recognitionRef.current) {
            try {
                recognitionRef.current.onend = null; // Prevent triggering old onend
                recognitionRef.current.abort();
            } catch (e) {
                // Ignore
            }
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            console.log('🎤 Listening...');
            setIsListening(true);
            setError(null);
        };

        recognition.onend = () => {
            console.log('🛑 Recognition ended');
            // Check if we should restart
            if (shouldRestartRef.current) {
                // Add a small delay and create a NEW instance
                setTimeout(() => {
                    if (shouldRestartRef.current) {
                        console.log('🔄 Restarting with fresh instance...');
                        createRecognition();
                    }
                }, 300);
            } else {
                setIsListening(false);
            }
        };

        recognition.onresult = (event) => {
            let finalTranscript = '';
            let interim = '';

            for (let i = 0; i < event.results.length; i++) {
                const result = event.results[i];
                const text = result[0].transcript;

                if (result.isFinal) {
                    finalTranscript += text;
                } else {
                    interim += text;
                }
            }

            if (finalTranscript) {
                setTranscript(finalTranscript);
            }
            setInterimTranscript(interim);
        };

        recognition.onerror = (event) => {
            console.error('❌ Error:', event.error);

            const errorMessages: Record<string, string> = {
                'no-speech': 'No speech detected. Try again.',
                'audio-capture': 'Microphone not found.',
                'not-allowed': 'Microphone access denied.',
                'network': 'Network error. Check your internet.',
                'aborted': 'Scanning stopped.',
            };

            if (event.error !== 'aborted' && event.error !== 'no-speech') {
                // Don't show technical errors to user, just log them
                if (event.error !== 'not-allowed' && event.error !== 'audio-capture') {
                    // For correctable errors, we might want to suppress and restart
                    // But for auth/hardware errors, we must stop
                } else {
                    setError(errorMessages[event.error] || `Error: ${event.error}`);
                    shouldRestartRef.current = false;
                }
            }
        };

        recognitionRef.current = recognition;

        try {
            recognition.start();
        } catch (e) {
            console.error('Failed to start recognition:', e);
            setError('Failed to start speech recognition');
            setIsListening(false);
        }
    }, [isSupported]);

    const startListening = useCallback(() => {
        if (!isSupported) {
            setError('Speech recognition is not supported in this browser.');
            return;
        }

        // Reset state
        setTranscript('');
        setInterimTranscript('');
        setError(null);
        shouldRestartRef.current = true;

        createRecognition();
    }, [isSupported, createRecognition]);

    const stopListening = useCallback(() => {
        console.log('⏹️ Stopping...');
        shouldRestartRef.current = false;

        if (recognitionRef.current) {
            try {
                recognitionRef.current.abort(); // abort is faster than stop for immediate cleanup
            } catch (e) {
                // Ignore
            }
        }
        setIsListening(false);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            shouldRestartRef.current = false;
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.abort();
                } catch (e) { }
            }
        };
    }, []);

    return {
        isListening,
        transcript,
        interimTranscript,
        startListening,
        stopListening,
        error,
        isSupported,
    };
}
