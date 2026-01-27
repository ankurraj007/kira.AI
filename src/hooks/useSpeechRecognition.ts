import { useState, useCallback, useRef } from 'react';

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

    const startListening = useCallback(() => {
        if (!isSupported) {
            setError('Speech recognition is not supported in this browser.');
            return;
        }

        // Stop any existing recognition
        if (recognitionRef.current) {
            try {
                recognitionRef.current.abort();
            } catch (e) {
                // Ignore
            }
        }

        // Reset state
        setTranscript('');
        setInterimTranscript('');
        setError(null);
        shouldRestartRef.current = true;

        // Create fresh recognition instance
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
            // Only restart if we should still be listening
            if (shouldRestartRef.current && recognitionRef.current) {
                console.log('� Restarting...');
                try {
                    recognitionRef.current.start();
                } catch (e) {
                    setIsListening(false);
                }
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
            };

            if (event.error !== 'aborted' && event.error !== 'no-speech') {
                setError(errorMessages[event.error] || `Error: ${event.error}`);
                shouldRestartRef.current = false;
            }
        };

        recognitionRef.current = recognition;

        try {
            recognition.start();
        } catch (e) {
            setError('Failed to start speech recognition');
        }
    }, [isSupported]);

    const stopListening = useCallback(() => {
        console.log('⏹️ Stopping...');
        shouldRestartRef.current = false;

        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                // Ignore
            }
        }
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
