export interface Message {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: Date;
}

export interface SpeechRecognitionResult {
    transcript: string;
    isFinal: boolean;
}

export interface GeminiResponse {
    text: string;
    error?: string;
}

// Web Speech API types
export interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

export interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionResult {
    length: number;
    isFinal: boolean;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}

export interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

export interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
}

// Extend Window interface for Web Speech API
declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition;
        webkitSpeechRecognition: new () => SpeechRecognition;
    }

    interface SpeechRecognition extends EventTarget {
        continuous: boolean;
        interimResults: boolean;
        lang: string;
        onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
        onend: ((this: SpeechRecognition, ev: Event) => void) | null;
        onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
        onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
        onaudiostart: ((this: SpeechRecognition, ev: Event) => void) | null;
        onaudioend: ((this: SpeechRecognition, ev: Event) => void) | null;
        onsoundstart: ((this: SpeechRecognition, ev: Event) => void) | null;
        onsoundend: ((this: SpeechRecognition, ev: Event) => void) | null;
        onspeechstart: ((this: SpeechRecognition, ev: Event) => void) | null;
        onspeechend: ((this: SpeechRecognition, ev: Event) => void) | null;
        start(): void;
        stop(): void;
        abort(): void;
    }
}
