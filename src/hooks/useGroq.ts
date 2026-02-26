import { useState, useCallback, useRef } from 'react';
import type { Message } from '../types';

interface UseGroqReturn {
    sendMessage: (userMessage: string, history: Message[], onChunk?: (chunk: string) => void) => Promise<string>;
    isLoading: boolean;
    error: string | null;
}

export function useGroq(): UseGroqReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const sendMessage = useCallback(async (userMessage: string, history: Message[], onChunk?: (chunk: string) => void): Promise<string> => {
        const apiKey = import.meta.env.VITE_GROQ_API_KEY;

        if (!apiKey) {
            const errorMsg = 'Groq API key not found. Please add VITE_GROQ_API_KEY to your .env file.';
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
            // Build messages in OpenAI format
            const messages = [
                {
                    role: 'system' as const,
                    content: 'You are a warm, human-like voice assistant. Keep responses natural, conversational, and concise. Avoid lists, bullets, or markdown. Use short sentences.'
                },
                ...history.map(msg => ({
                    role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
                    content: msg.content
                })),
                {
                    role: 'user' as const,
                    content: userMessage
                }
            ];

            // Use Groq's OpenAI-compatible streaming API
            const response = await fetch(
                'https://api.groq.com/openai/v1/chat/completions',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify({
                        model: 'llama-3.1-8b-instant',
                        messages,
                        temperature: 0.8,
                        max_tokens: 1024,
                        stream: true,
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
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                        try {
                            const data = JSON.parse(line.slice(6));
                            const textChunk = data.choices?.[0]?.delta?.content;
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
            console.error('Groq API Error:', errorMessage);

            // Provide friendly message for rate limits
            if (errorMessage.toLowerCase().includes('rate') || errorMessage.includes('429')) {
                errorMessage = 'Rate limit reached. Please wait a minute and try again.';
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
