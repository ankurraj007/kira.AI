interface HeaderProps {
    isListening: boolean;
    isSpeaking?: boolean;
}

export function Header({ isListening, isSpeaking }: HeaderProps) {
    const getStatus = () => {
        if (isSpeaking) return { text: 'RESPONDING', dotClass: 'status-dot-speaking' };
        if (isListening) return { text: 'LISTENING', dotClass: 'status-dot-listening' };
        return { text: 'STANDBY', dotClass: 'status-dot' };
    };

    const status = getStatus();

    return (
        <header className="glass-dark fixed top-0 left-0 right-0 z-50 px-6 py-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {/* Logo */}
                    <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center neon-border"
                        style={{
                            background: 'linear-gradient(135deg, rgba(0, 180, 230, 0.2) 0%, rgba(0, 50, 80, 0.4) 100%)',
                        }}
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            style={{ color: 'var(--accent-primary)' }}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-1.007.743a2.25 2.25 0 01-1.66.478h-1.397a2.25 2.25 0 00-1.59.659l-.622.621a2.25 2.25 0 01-1.59.659h-2.268a2.25 2.25 0 01-1.59-.659l-.622-.621a2.25 2.25 0 00-1.59-.659h-1.397a2.25 2.25 0 01-1.66-.478L5 14.5m14 0v4.59a2.25 2.25 0 01-2.093 2.244l-.758.057a22.925 22.925 0 01-3.298 0l-.758-.057A2.25 2.25 0 0110.5 19.09v-4.59m7 0H5"
                            />
                        </svg>
                    </div>
                    <div>
                        <h1 className="font-display text-lg font-semibold tracking-wider neon-text">
                            Kira.AI
                        </h1>
                        <p className="text-[10px] tracking-widest text-white/40 font-mono">
                            Knows more, Asks less.
                        </p>
                    </div>
                </div>

                {/* Status indicator */}
                <div className="flex items-center gap-3 glass px-4 py-2 rounded-full">
                    <div className={`${status.dotClass} transition-all duration-300`} />
                    <span className="font-mono text-xs tracking-wider text-white/70">
                        {status.text}
                    </span>
                </div>
            </div>
        </header>
    );
}
