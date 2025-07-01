// src/ui/components/MP3Player.tsx
import React, { useState, useRef, useEffect } from 'react';

interface MP3PlayerProps {
    file: MP3File | null;
    onEnded?: () => void;
}

export const Player: React.FC<MP3PlayerProps> = ({ file, onEnded }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<AudioBufferSourceNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const audioBufferRef = useRef<AudioBuffer | null>(null);
    const startTimeRef = useRef<number>(0);
    const pauseTimeRef = useRef<number>(0);
    const animationFrameRef = useRef<number>(0);

    useEffect(() => {
        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (file) {
            loadAudioFile();
        }
    }, [file]);

    const initAudioContext = () => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            gainNodeRef.current = audioContextRef.current.createGain();
            gainNodeRef.current.connect(audioContextRef.current.destination);
            gainNodeRef.current.gain.value = volume;
        }
    };

    const loadAudioFile = async () => {
        if (!file) return;
        
        setIsLoading(true);
        try {
            const bufferArray = await window.electron.getMP3FileBuffer(file.id);
            const audioBuffer = new Uint8Array(bufferArray).buffer;
            
            initAudioContext();
            if (!audioContextRef.current) return;
            
            const decodedBuffer = await audioContextRef.current.decodeAudioData(audioBuffer);
            audioBufferRef.current = decodedBuffer;
            setDuration(decodedBuffer.duration);
            setCurrentTime(0);
            pauseTimeRef.current = 0;
        } catch (error) {
            console.error('Error loading audio file:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const play = () => {
        if (!audioContextRef.current || !audioBufferRef.current || !gainNodeRef.current) return;
        
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }

        // Stop current source if playing
        if (sourceRef.current) {
            sourceRef.current.stop();
        }

        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBufferRef.current;
        source.connect(gainNodeRef.current);
        
        source.onended = () => {
            setIsPlaying(false);
            if (pauseTimeRef.current >= duration) {
                setCurrentTime(0);
                pauseTimeRef.current = 0;
                onEnded?.();
            }
        };

        source.start(0, pauseTimeRef.current);
        startTimeRef.current = audioContextRef.current.currentTime - pauseTimeRef.current;
        sourceRef.current = source;
        setIsPlaying(true);
        
        updateCurrentTime();
    };

    const pause = () => {
        if (sourceRef.current) {
            sourceRef.current.stop();
            setIsPlaying(false);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        }
    };

    const stop = () => {
        if (sourceRef.current) {
            sourceRef.current.stop();
            setIsPlaying(false);
            setCurrentTime(0);
            pauseTimeRef.current = 0;
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        }
    };

    const seek = (time: number) => {
        pauseTimeRef.current = Math.max(0, Math.min(time, duration));
        setCurrentTime(pauseTimeRef.current);
        
        if (isPlaying) {
            pause();
            setTimeout(() => play(), 10);
        }
    };

    const updateCurrentTime = () => {
        if (isPlaying && audioContextRef.current) {
            const elapsed = audioContextRef.current.currentTime - startTimeRef.current;
            const newTime = Math.min(elapsed, duration);
            setCurrentTime(newTime);
            pauseTimeRef.current = newTime;
            
            if (newTime < duration) {
                animationFrameRef.current = requestAnimationFrame(updateCurrentTime);
            }
        }
    };

    const changeVolume = (newVolume: number) => {
        setVolume(newVolume);
        if (gainNodeRef.current) {
            gainNodeRef.current.gain.value = newVolume;
        }
    };

    const formatTime = (time: number): string => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    if (!file) {
        return <div>No file selected</div>;
    }

    return (
        <div className="mp3-player">
            <div className="track-info">
                <h3>{file.title || file.filename}</h3>
                <p>{file.artist} {file.album && `- ${file.album}`}</p>
            </div>
            
            <div className="progress-container">
                <span>{formatTime(currentTime)}</span>
                <input
                    type="range"
                    min="0"
                    max={duration}
                    value={currentTime}
                    onChange={(e) => seek(Number(e.target.value))}
                    className="progress-bar"
                />
                <span>{formatTime(duration)}</span>
            </div>
            
            <div className="controls">
                <button onClick={stop} disabled={isLoading}>⏹️</button>
                <button 
                    onClick={isPlaying ? pause : play} 
                    disabled={isLoading || !audioBufferRef.current}
                >
                    {isLoading ? '⏳' : isPlaying ? '⏸️' : '▶️'}
                </button>
            </div>
            
            <div className="volume-control">
                <span>🔊</span>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => changeVolume(Number(e.target.value))}
                />
            </div>
        </div>
    );
};