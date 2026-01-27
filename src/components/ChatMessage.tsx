import type { Message } from '../types';

interface ChatMessageProps {
    message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
    const isUser = message.role === 'user';

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    };

    return (
        <div
            className={`
        flex w-full animate-fade-in-up
        ${isUser ? 'justify-end' : 'justify-start'}
      `}
        >
            <div
                className={`
          max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3
          transition-all duration-300
          ${isUser
                        ? 'user-message-gradient rounded-br-md'
                        : 'ai-message-gradient rounded-bl-md'
                    }
        `}
            >
                {/* Role indicator */}
                <div
                    className={`
            text-[10px] font-mono tracking-wider uppercase mb-1.5
            ${isUser ? 'text-cyan-300/70' : 'text-cyan-400/60'}
          `}
                >
                    {isUser ? 'USER' : 'Kira'}
                </div>

                {/* Message content */}
                <p className="text-sm md:text-base leading-relaxed break-words text-white/90">
                    {message.content}
                </p>

                {/* Timestamp */}
                <div
                    className={`
            text-[10px] font-mono mt-2
            ${isUser ? 'text-cyan-300/40' : 'text-white/30'}
          `}
                >
                    {formatTime(message.timestamp)}
                </div>
            </div>
        </div>
    );
}

// Typing indicator component
export function TypingIndicator() {
    return (
        <div className="flex justify-start animate-fade-in-up">
            <div className="ai-message-gradient rounded-2xl rounded-bl-md px-4 py-3">
                <div className="text-[10px] font-mono tracking-wider uppercase mb-1.5 text-cyan-400/60">
                    Kira
                </div>
                <div className="flex gap-1.5 py-2">
                    <div
                        className="w-2 h-2 rounded-full animate-typing-dot"
                        style={{ background: 'var(--accent-primary)', opacity: 0.7 }}
                    />
                    <div
                        className="w-2 h-2 rounded-full animate-typing-dot"
                        style={{ background: 'var(--accent-primary)', opacity: 0.7, animationDelay: '0.2s' }}
                    />
                    <div
                        className="w-2 h-2 rounded-full animate-typing-dot"
                        style={{ background: 'var(--accent-primary)', opacity: 0.7, animationDelay: '0.4s' }}
                    />
                </div>
            </div>
        </div>
    );
}
