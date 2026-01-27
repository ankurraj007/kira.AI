import { useEffect, useRef } from 'react';
import type { Message } from '../types';
import { ChatMessage, TypingIndicator } from './ChatMessage';

interface ChatContainerProps {
    messages: Message[];
    isLoading: boolean;
    interimTranscript?: string;
}

export function ChatContainer({ messages, isLoading, interimTranscript }: ChatContainerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading, interimTranscript]);

    const isEmpty = messages.length === 0 && !interimTranscript;

    return (
        <div
            ref={containerRef}
            className="flex-1 overflow-y-auto custom-scrollbar px-4 py-6"
        >
            <div className="max-w-3xl mx-auto space-y-4">
                {isEmpty ? (
                    <EmptyState />
                ) : (
                    <>
                        {messages.map((message) => (
                            <ChatMessage key={message.id} message={message} />
                        ))}

                        {/* Show interim transcript as user is speaking */}
                        {interimTranscript && (
                            <div className="flex justify-end animate-fade-in-up">
                                <div
                                    className="max-w-[80%] md:max-w-[70%] rounded-2xl rounded-br-md px-4 py-3"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(0, 180, 230, 0.15) 0%, rgba(0, 212, 255, 0.1) 100%)',
                                        border: '1px solid rgba(0, 212, 255, 0.2)',
                                    }}
                                >
                                    <div className="text-[10px] font-mono tracking-wider uppercase mb-1.5 text-cyan-300/50">
                    // TRANSCRIBING...
                                    </div>
                                    <p className="text-sm md:text-base text-white/70 italic">
                                        {interimTranscript}
                                    </p>
                                </div>
                            </div>
                        )}

                        {isLoading && <TypingIndicator />}
                    </>
                )}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-4">
        </div>
    );
}
