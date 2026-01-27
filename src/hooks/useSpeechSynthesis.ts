import { useState, useCallback, useRef, useEffect } from 'react';

interface UseSpeechSynthesisReturn {
    speak: (text: string) => void;
    stop: () => void;
    isSpeaking: boolean;
    voices: SpeechSynthesisVoice[];
    selectedVoice: SpeechSynthesisVoice | null;
    setSelectedVoice: (voice: SpeechSynthesisVoice) => void;
    isSupported: boolean;
}

export function useSpeechSynthesis(): UseSpeechSynthesisReturn {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
    const queueRef = useRef<string[]>([]);
    const isProcessingRef = useRef(false);
    const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

    const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

    // Keep ref in sync with state
    useEffect(() => {
        selectedVoiceRef.current = selectedVoice;
    }, [selectedVoice]);

    // Load available voices
    useEffect(() => {
        if (!isSupported) return;

        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            setVoices(availableVoices);

            // Select a good default English voice
            const englishVoice = availableVoices.find(
                v => v.lang.startsWith('en') && v.name.includes('Google')
            ) || availableVoices.find(
                v => v.lang.startsWith('en')
            ) || availableVoices[0];

            if (englishVoice && !selectedVoice) {
                setSelectedVoice(englishVoice);
            }
        };

        // Voices may load asynchronously
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;

        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, [isSupported, selectedVoice]);

    // Process the speech queue
    const processQueue = useCallback(() => {
        if (!isSupported || isProcessingRef.current || queueRef.current.length === 0) {
            if (queueRef.current.length === 0) {
                setIsSpeaking(false);
            }
            return;
        }

        isProcessingRef.current = true;
        setIsSpeaking(true);

        const text = queueRef.current.shift()!;
        const utterance = new SpeechSynthesisUtterance(text);

        if (selectedVoiceRef.current) {
            utterance.voice = selectedVoiceRef.current;
        }

        utterance.rate = 1.1;  // Slightly faster for responsiveness
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onend = () => {
            isProcessingRef.current = false;
            // Process next item in queue
            processQueue();
        };

        utterance.onerror = (event) => {
            // Only log actual errors, not interruptions from stop()
            if (event.error !== 'interrupted' && event.error !== 'canceled') {
                console.error('Speech synthesis error:', event.error);
            }
            isProcessingRef.current = false;
            processQueue();
        };

        window.speechSynthesis.speak(utterance);
    }, [isSupported]);

    const speak = useCallback((text: string) => {
        if (!isSupported || !text.trim()) return;

        // Add to queue instead of interrupting
        queueRef.current.push(text);
        setIsSpeaking(true);

        // Start processing if not already
        if (!isProcessingRef.current) {
            processQueue();
        }
    }, [isSupported, processQueue]);

    const stop = useCallback(() => {
        if (isSupported) {
            queueRef.current = []; // Clear queue
            window.speechSynthesis.cancel();
            isProcessingRef.current = false;
            setIsSpeaking(false);
        }
    }, [isSupported]);

    return {
        speak,
        stop,
        isSpeaking,
        voices,
        selectedVoice,
        setSelectedVoice,
        isSupported,
    };
}
