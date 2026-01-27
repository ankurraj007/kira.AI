import { useState, useRef, useCallback, useEffect } from 'react';

interface AudioAnalyzerData {
    amplitude: number;
    frequencyData: Uint8Array;
    bassLevel: number;
    midLevel: number;
    highLevel: number;
}

interface UseAudioAnalyzerReturn {
    isAnalyzing: boolean;
    audioData: AudioAnalyzerData;
    startAnalyzing: () => Promise<void>;
    stopAnalyzing: () => void;
    error: string | null;
}

const DEFAULT_AUDIO_DATA: AudioAnalyzerData = {
    amplitude: 0,
    frequencyData: new Uint8Array(128),
    bassLevel: 0,
    midLevel: 0,
    highLevel: 0,
};

export function useAudioAnalyzer(): UseAudioAnalyzerReturn {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [audioData, setAudioData] = useState<AudioAnalyzerData>(DEFAULT_AUDIO_DATA);
    const [error, setError] = useState<string | null>(null);

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyzerRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationFrameRef = useRef<number>(0);

    // Smoothing values
    const smoothedAmplitudeRef = useRef(0);
    const smoothedBassRef = useRef(0);
    const smoothedMidRef = useRef(0);
    const smoothedHighRef = useRef(0);

    const analyze = useCallback(() => {
        if (!analyzerRef.current) return;

        const analyzer = analyzerRef.current;
        const bufferLength = analyzer.frequencyBinCount;
        const frequencyData = new Uint8Array(bufferLength);
        const timeData = new Uint8Array(bufferLength);

        analyzer.getByteFrequencyData(frequencyData);
        analyzer.getByteTimeDomainData(timeData);

        // Calculate amplitude from time domain data
        let sum = 0;
        for (let i = 0; i < timeData.length; i++) {
            const value = (timeData[i] - 128) / 128;
            sum += value * value;
        }
        const rms = Math.sqrt(sum / timeData.length);
        const amplitude = Math.min(rms * 3, 1); // Scale up for visibility

        // Calculate frequency band levels
        const third = Math.floor(bufferLength / 3);

        let bassSum = 0;
        let midSum = 0;
        let highSum = 0;

        for (let i = 0; i < third; i++) {
            bassSum += frequencyData[i];
        }
        for (let i = third; i < third * 2; i++) {
            midSum += frequencyData[i];
        }
        for (let i = third * 2; i < bufferLength; i++) {
            highSum += frequencyData[i];
        }

        const bassLevel = (bassSum / third) / 255;
        const midLevel = (midSum / third) / 255;
        const highLevel = (highSum / third) / 255;

        // Apply exponential smoothing
        const smoothing = 0.7;
        smoothedAmplitudeRef.current = smoothedAmplitudeRef.current * smoothing + amplitude * (1 - smoothing);
        smoothedBassRef.current = smoothedBassRef.current * smoothing + bassLevel * (1 - smoothing);
        smoothedMidRef.current = smoothedMidRef.current * smoothing + midLevel * (1 - smoothing);
        smoothedHighRef.current = smoothedHighRef.current * smoothing + highLevel * (1 - smoothing);

        setAudioData({
            amplitude: smoothedAmplitudeRef.current,
            frequencyData,
            bassLevel: smoothedBassRef.current,
            midLevel: smoothedMidRef.current,
            highLevel: smoothedHighRef.current,
        });

        animationFrameRef.current = requestAnimationFrame(analyze);
    }, []);

    const startAnalyzing = useCallback(async () => {
        try {
            setError(null);

            // Get microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                }
            });
            streamRef.current = stream;

            // Create audio context
            const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
            audioContextRef.current = audioContext;

            // Create analyzer node
            const analyzer = audioContext.createAnalyser();
            analyzer.fftSize = 256;
            analyzer.smoothingTimeConstant = 0.8;
            analyzerRef.current = analyzer;

            // Connect microphone to analyzer
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyzer);
            sourceRef.current = source;

            setIsAnalyzing(true);

            // Start analysis loop
            analyze();
        } catch (err) {
            console.error('Failed to start audio analyzer:', err);
            setError(err instanceof Error ? err.message : 'Failed to access microphone');
        }
    }, [analyze]);

    const stopAnalyzing = useCallback(() => {
        // Cancel animation frame
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }

        // Disconnect and close audio nodes
        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }

        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        // Stop media stream tracks
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        analyzerRef.current = null;

        // Reset smoothed values
        smoothedAmplitudeRef.current = 0;
        smoothedBassRef.current = 0;
        smoothedMidRef.current = 0;
        smoothedHighRef.current = 0;

        setIsAnalyzing(false);
        setAudioData(DEFAULT_AUDIO_DATA);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopAnalyzing();
        };
    }, [stopAnalyzing]);

    return {
        isAnalyzing,
        audioData,
        startAnalyzing,
        stopAnalyzing,
        error,
    };
}
