import { ParticleSphere, type SphereState } from './ParticleSphere';

interface VoiceButtonProps {
    isListening: boolean;
    isLoading: boolean;
    isSpeaking?: boolean;
    onClick: () => void;
    disabled?: boolean;
    amplitude?: number;
    bassLevel?: number;
    midLevel?: number;
    highLevel?: number;
}

export function VoiceButton({
    isListening,
    isLoading,
    isSpeaking,
    onClick,
    disabled,
    amplitude = 0,
    bassLevel = 0,
    midLevel = 0,
    highLevel = 0,
}: VoiceButtonProps) {

    // Determine sphere state
    const getSphereState = (): SphereState => {
        if (isLoading) return 'processing';
        if (isSpeaking) return 'speaking';
        if (isListening) return 'listening';
        return 'idle';
    };

    const getLabel = () => {
        if (isLoading) return 'PROCESSING...';
        if (isSpeaking) return 'SPEAKING...';
        if (isListening) return 'LISTENING...';
        return 'TAP TO SPEAK';
    };

    const getStatusClass = () => {
        if (isLoading) return 'status-dot-processing';
        if (isSpeaking) return 'status-dot-speaking';
        if (isListening) return 'status-dot-listening';
        return 'status-dot';
    };

    return (
        <div className="relative flex flex-col items-center">
            {/* Outer glow ring */}
            <div
                className={`
          absolute rounded-full transition-all duration-700 ease-out
          ${isListening ? 'w-52 h-52 opacity-60' : 'w-44 h-44 opacity-30'}
        `}
                style={{
                    background: 'radial-gradient(circle, rgba(0, 212, 255, 0.5) 0%, rgba(0, 212, 255, 0.2) 40%, transparent 70%)',
                    filter: 'blur(15px)',
                }}
            />

            {/* Pulse rings when active */}
            {(isListening || isSpeaking) && (
                <>
                    <div
                        className="absolute w-40 h-40 rounded-full animate-pulse-ring"
                        style={{
                            border: '2px solid rgba(0, 212, 255, 0.6)',
                            boxShadow: '0 0 30px rgba(0, 212, 255, 0.4), 0 0 60px rgba(0, 212, 255, 0.2)',
                        }}
                    />
                    <div
                        className="absolute w-40 h-40 rounded-full animate-pulse-ring"
                        style={{
                            animationDelay: '0.5s',
                            border: '2px solid rgba(0, 212, 255, 0.4)',
                            boxShadow: '0 0 25px rgba(0, 212, 255, 0.3), 0 0 50px rgba(0, 212, 255, 0.15)',
                        }}
                    />
                </>
            )}

            {/* Main sphere container */}
            <button
                onClick={onClick}
                disabled={disabled || isLoading}
                className={`
          relative z-10 w-36 h-36 rounded-full
          flex items-center justify-center
          transition-all duration-500 ease-out
          glass-glow
          ${isListening || isSpeaking ? 'scale-105' : 'hover:scale-102'}
          ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          focus:outline-none focus:ring-2 focus:ring-cyan-400/50
        `}
                style={{
                    background: 'radial-gradient(circle at 30% 30%, rgba(0, 50, 80, 0.4) 0%, rgba(5, 7, 10, 0.8) 100%)',
                }}
                aria-label={getLabel()}
            >
                {/* 3D Particle Sphere */}
                <div className="w-full h-full p-4">
                    <ParticleSphere
                        state={getSphereState()}
                        amplitude={amplitude}
                        bassLevel={bassLevel}
                        midLevel={midLevel}
                        highLevel={highLevel}
                    />
                </div>
            </button>

            {/* Status indicator and label */}
            <div className="mt-4 flex items-center gap-2">
                <div className={`${getStatusClass()} transition-all duration-300`} />
                <p className="font-display text-sm tracking-widest text-cyan-400/80">
                    {getLabel()}
                </p>
            </div>

            {/* Subtle instruction */}
            {!isListening && !isSpeaking && !isLoading && (
                <p className="mt-2 text-xs text-white/30 font-mono">
                    Click or press Space
                </p>
            )}
        </div>
    );
}
