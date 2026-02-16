import { useState, useCallback, useRef } from 'react';
import type { Message } from '../types';

interface UseGeminiReturn {
    sendMessage: (userMessage: string, history: Message[], onChunk?: (chunk: string) => void) => Promise<string>;
    isLoading: boolean;
    error: string | null;
}

export function useGemini(): UseGeminiReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const sendMessage = useCallback(async (userMessage: string, history: Message[], onChunk?: (chunk: string) => void): Promise<string> => {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

        if (!apiKey) {
            const errorMsg = 'Gemini API key not found. Please add VITE_GEMINI_API_KEY to your .env file.';
            setError(errorMsg);
            throw new Error(errorMsg);
        }

        // Cancel any ongoing request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        setIsLoading(true);
        setError(null);

        try {
            const contents = [
                {
                    role: 'user',
                    parts: [{ text: 'You are a warm, human-like voice assistant. Keep responses natural, conversational, and concise. Avoid lists, bullets, or markdown. Use short sentences.' }]
                },
                {
                    role: 'model',
                    parts: [{ text: 'I understand. I will keep my responses naturally conversational and brief.' }]
                },
                ...history.map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }]
                })),
                {
                    role: 'user',
                    parts: [{ text: userMessage }]
                }
            ];

            // Use streamGenerateContent for faster response
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents,
                        generationConfig: {
                            temperature: 0.8,
                            topK: 40,
                            topP: 0.95,
                            maxOutputTokens: 1024,
                        },
                    }),
                    signal: abortControllerRef.current.signal,
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `API error: ${response.status}`);
            }

            if (!response.body) {
                throw new Error('No response body');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                // SSE format: data: {"candidates": [...]}
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            const textChunk = data.candidates?.[0]?.content?.parts?.[0]?.text;
                            if (textChunk) {
                                fullText += textChunk;
                                if (onChunk) onChunk(textChunk);
                            }
                        } catch (e) {
                            // Ignore incomplete JSON chunks
                        }
                    }
                }
            }

            if (!fullText) {
                throw new Error('Empty response from API.');
            }

            setIsLoading(false);
            return fullText;

        } catch (err) {
            if ((err as Error).name === 'AbortError') {
                throw err;
            }
            let errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';

            // Provide friendly message for quota limits
            if (errorMessage.toLowerCase().includes('quota') || errorMessage.includes('429')) {
                errorMessage = 'Token limit reached. Please try again after some time.';
            }

            setError(errorMessage);
            setIsLoading(false);
            throw new Error(errorMessage);
        }
    }, []);

    return {
        sendMessage,
        isLoading,
        error,
    };
}
