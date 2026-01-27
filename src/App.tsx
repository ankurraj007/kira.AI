import { useState, useCallback, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { ChatContainer } from './components/ChatContainer';
import { VoiceButton } from './components/VoiceButton';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';
import { useGemini } from './hooks/useGemini';
import { useAudioAnalyzer } from './hooks/useAudioAnalyzer';
import type { Message } from './types';
import './index.css';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);

  const {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    error: speechError,
    isSupported: isSpeechSupported,
  } = useSpeechRecognition();

  const { speak, stop: stopSpeaking, isSpeaking } = useSpeechSynthesis();
  const { sendMessage, isLoading, error: geminiError } = useGemini();

  // Audio analyzer for voice-reactive visualizations
  const {
    audioData,
    startAnalyzing,
    stopAnalyzing
  } = useAudioAnalyzer();

  // Refs for state management
  const transcriptRef = useRef(transcript);
  const messagesRef = useRef(messages);
  const currentSentenceRef = useRef('');

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const handleVoiceButtonClick = useCallback(async () => {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    if (isListening) {
      stopListening();
      stopAnalyzing();

      setTimeout(async () => {
        const finalText = transcriptRef.current.trim();
        if (!finalText) return;

        // Add user message
        const userMsgId = crypto.randomUUID();
        const userMessage: Message = {
          id: userMsgId,
          content: finalText,
          role: 'user',
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setError(null);

        // Prepare placeholder for AI response
        const aiMsgId = crypto.randomUUID();
        setMessages(prev => [...prev, {
          id: aiMsgId,
          content: '',
          role: 'assistant',
          timestamp: new Date(),
        }]);

        let fullAiText = '';
        currentSentenceRef.current = '';

        try {
          await sendMessage(finalText, messagesRef.current, (chunk) => {
            fullAiText += chunk;
            currentSentenceRef.current += chunk;

            // Update UI with current stream
            setMessages(prev => prev.map(msg =>
              msg.id === aiMsgId ? { ...msg, content: fullAiText } : msg
            ));

            // Check for sentence boundaries to trigger TTS
            const sentences = currentSentenceRef.current.split(/([.!?]\s+)/);
            if (sentences.length > 2) {
              const completeSentence = sentences[0] + sentences[1];
              speak(completeSentence.trim());
              currentSentenceRef.current = sentences.slice(2).join('');
            }
          });

          // Speak whatever is left at the end
          if (currentSentenceRef.current.trim()) {
            speak(currentSentenceRef.current.trim());
          }

        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to get AI response');
        }
      }, 200);
    } else {
      stopSpeaking();
      startListening();
      startAnalyzing();
    }
  }, [isListening, isSpeaking, startListening, stopListening, sendMessage, speak, stopSpeaking, startAnalyzing, stopAnalyzing]);

  const displayError = error || speechError || geminiError;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Main gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(0, 50, 80, 0.15) 0%, transparent 50%)',
          }}
        />

        {/* Ambient glow orbs */}
        <div
          className="absolute top-1/4 -left-32 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: 'var(--accent-primary)' }}
        />
        <div
          className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full blur-3xl opacity-15"
          style={{ background: 'var(--accent-secondary)' }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-5"
          style={{ background: 'var(--accent-primary)' }}
        />

        {/* Particle dust effect */}
        <div className="particle-container">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="particle-dust"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 8}s`,
                animationDuration: `${6 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>
      </div>

      <Header isListening={isListening} isSpeaking={isSpeaking} />

      <main className="flex-1 flex flex-col pt-20 pb-36 relative z-10">
        <ChatContainer
          messages={messages}
          isLoading={isLoading && messages.length > 0 && messages[messages.length - 1].content === ''}
          interimTranscript={isListening ? (interimTranscript || transcript) : undefined}
        />
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="glass-dark py-4 px-4">
          <div className="max-w-4xl mx-auto flex flex-col items-center">
            {displayError && (
              <div
                className="mb-4 px-4 py-2 rounded-lg text-sm text-center max-w-md font-mono"
                style={{
                  background: 'rgba(255, 80, 80, 0.1)',
                  border: '1px solid rgba(255, 80, 80, 0.3)',
                  color: '#FF8080',
                }}
              >
                [ ERROR ] {displayError}
              </div>
            )}

            {!isSpeechSupported && (
              <div
                className="mb-4 px-4 py-2 rounded-lg text-sm text-center max-w-md font-mono"
                style={{
                  background: 'rgba(255, 184, 0, 0.1)',
                  border: '1px solid rgba(255, 184, 0, 0.3)',
                  color: '#FFB800',
                }}
              >
                [ WARNING ] Speech recognition requires Chrome browser
              </div>
            )}

            <VoiceButton
              isListening={isListening}
              isLoading={isLoading}
              isSpeaking={isSpeaking}
              onClick={handleVoiceButtonClick}
              disabled={!isSpeechSupported}
              amplitude={audioData.amplitude}
              bassLevel={audioData.bassLevel}
              midLevel={audioData.midLevel}
              highLevel={audioData.highLevel}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
