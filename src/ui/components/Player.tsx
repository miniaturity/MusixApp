// src/ui/components/MP3Player.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AlbumArt } from './AlbumArt';
import { MiniQueue } from './MiniQueue';

interface MP3PlayerProps {
	file: MP3File | null;
	onEnded?: () => void;
	last: () => void;
	next: () => void;
	folder: MP3Folder | null;
	selectFolder: () => void;
	selectFile: (file: MP3File, index: number) => void;
}

const audioElementCache = new Map<string, HTMLAudioElement>();
const MAX_CACHE_SIZE = 5;
const cacheOrder: string[] = [];

const addToCache = (fileId: string, audio: HTMLAudioElement) => {
	// Remove if already exists
	const existingIndex = cacheOrder.indexOf(fileId);
	if (existingIndex !== -1) {
		cacheOrder.splice(existingIndex, 1);
	}

	// Add to front
	cacheOrder.unshift(fileId);
	audioElementCache.set(fileId, audio);

	// Evict oldest if cache is full
	if (cacheOrder.length > MAX_CACHE_SIZE) {
		const oldestFileId = cacheOrder.pop()!;
		const oldAudio = audioElementCache.get(oldestFileId);
		if (oldAudio) {
			URL.revokeObjectURL(oldAudio.src);
			audioElementCache.delete(oldestFileId);
		}
	}
};

const getFromCache = (fileId: string): HTMLAudioElement | null => {
	const audio = audioElementCache.get(fileId);
	if (audio) {
		// Move to front (recently used)
		const index = cacheOrder.indexOf(fileId);
		if (index !== -1) {
			cacheOrder.splice(index, 1);
			cacheOrder.unshift(fileId);
		}
	}
	return audio || null;
};

export const Player: React.FC<MP3PlayerProps> = ({ 
	file, 
	folder, 
	onEnded, 
	next,
	last,
	selectFolder,
	selectFile,
}) => {
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [volume, setVolume] = useState(1);
	const [isLoading, setIsLoading] = useState(false);
	const [loadProgress, setLoadProgress] = useState(0);

	const audioRef = useRef<HTMLAudioElement | null>(null);
	const currentFileIdRef = useRef<string | null>(null);
	const preloadingRef = useRef<Set<string>>(new Set());

	useEffect(() => {
		return () => {
			// Cleanup audio element
			if (audioRef.current) {
				audioRef.current.pause();
				if (audioRef.current.src.startsWith('blob:')) {
					URL.revokeObjectURL(audioRef.current.src);
				}
			}
		};
	}, []);

	useEffect(() => {
		if (file && file.id !== currentFileIdRef.current) {
			loadAudioFile();
		}
	}, [file]);

	const createAudioElement = useCallback(async (fileId: string): Promise<HTMLAudioElement> => {
		// Check cache first
		const cachedAudio = getFromCache(fileId);
		if (cachedAudio) {
			return cachedAudio;
		}

		// Create new audio element
		const audio = new Audio();
		audio.preload = 'auto';
		audio.volume = volume;

		// Get file buffer and create blob URL - this is much faster than AudioContext
		const bufferArray = await window.electron.getMP3FileBuffer(fileId);
		const blob = new Blob([new Uint8Array(bufferArray)], { type: 'audio/mpeg' });
		const audioUrl = URL.createObjectURL(blob);
		
		audio.src = audioUrl;

		// Add to cache
		addToCache(fileId, audio);

		return audio;
	}, [volume]);

	const loadAudioFile = async () => {
		if (!file) return;

		setIsLoading(true);
		setLoadProgress(0);

		try {
			const audio = await createAudioElement(file.id);
			
			// Set up event listeners
			const handleLoadedMetadata = () => {
				setDuration(audio.duration || 0);
				setCurrentTime(audio.currentTime);
				setIsLoading(false);
				setLoadProgress(100);
			};

			const handleTimeUpdate = () => {
				setCurrentTime(audio.currentTime);
			};

			const handleEnded = () => {
				setIsPlaying(false);
				onEnded?.();
				next?.(); // Auto-advance to next track
			};

			const handleProgress = () => {
				if (audio.buffered.length > 0) {
					const buffered = audio.buffered.end(audio.buffered.length - 1);
					const progress = (buffered / audio.duration) * 100;
					setLoadProgress(progress);
				}
			};

			const handleCanPlay = () => {
				setIsLoading(false);
			};

			// Remove old listeners if they exist
			if (audioRef.current) {
				audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
				audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
				audioRef.current.removeEventListener('ended', handleEnded);
				audioRef.current.removeEventListener('progress', handleProgress);
				audioRef.current.removeEventListener('canplay', handleCanPlay);
			}

			// Add new listeners
			audio.addEventListener('loadedmetadata', handleLoadedMetadata);
			audio.addEventListener('timeupdate', handleTimeUpdate);
			audio.addEventListener('ended', handleEnded);
			audio.addEventListener('progress', handleProgress);
			audio.addEventListener('canplay', handleCanPlay);

			audioRef.current = audio;
			currentFileIdRef.current = file.id;

			// If metadata is already loaded
			if (audio.readyState >= 1) {
				handleLoadedMetadata();
			}

			// Start preloading adjacent files
			preloadAdjacentFiles();

		} catch (error) {
			console.error('Error loading audio file:', error);
			setIsLoading(false);
		}
	};

	const preloadAdjacentFiles = useCallback(async () => {
		if (!file || !folder) return;

		const currentIndex = folder.files.findIndex(f => f.id === file.id);
		if (currentIndex === -1) return;

		// Preload next file
		if (currentIndex < folder.files.length - 1) {
			const nextFile = folder.files[currentIndex + 1];
			if (!preloadingRef.current.has(nextFile.id) && !getFromCache(nextFile.id)) {
				preloadingRef.current.add(nextFile.id);
				createAudioElement(nextFile.id)
					.catch(err => console.warn('Failed to preload next file:', err))
					.finally(() => preloadingRef.current.delete(nextFile.id));
			}
		}

		// Preload previous file
		if (currentIndex > 0) {
			const prevFile = folder.files[currentIndex - 1];
			if (!preloadingRef.current.has(prevFile.id) && !getFromCache(prevFile.id)) {
				preloadingRef.current.add(prevFile.id);
				createAudioElement(prevFile.id)
					.catch(err => console.warn('Failed to preload previous file:', err))
					.finally(() => preloadingRef.current.delete(prevFile.id));
			}
		}
	}, [file, folder, createAudioElement]);

	const play = async () => {
		if (!audioRef.current) return;

		try {
			await audioRef.current.play();
			setIsPlaying(true);
		} catch (error) {
			console.error('Error playing audio:', error);
		}
	};

	const pause = () => {
		if (audioRef.current) {
			audioRef.current.pause();
			setIsPlaying(false);
		}
	};

	const stop = () => {
		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current.currentTime = 0;
			setIsPlaying(false);
			setCurrentTime(0);
		}
	};

	const seek = (time: number) => {
		if (audioRef.current) {
			audioRef.current.currentTime = time;
			setCurrentTime(time);
		}
	};

	const changeVolume = (newVolume: number) => {
		setVolume(newVolume);
		if (audioRef.current) {
			audioRef.current.volume = newVolume;
		}
	};

	const handleNext = () => {
		stop();
		setTimeout(() => {
			next?.();
			play();
		}, 50);
	};

	const handlePrevious = () => {
		last?.();
	};

	const formatFileName = (n: string): string => {
		return n.split('.')[0];
	}

	const formatTime = (time: number): string => {
		const minutes = Math.floor(time / 60);
		const seconds = Math.floor(time % 60);
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	};

	const getCurrentIndex = () => {
		if (!file || !folder) return 0;
		return folder.files.findIndex(f => f.id === file.id) + 1;
	};

	return (
		<div className="player">
			<div className="top">
				<div className="track-info">
					<div className="track-index">Track {(getCurrentIndex())} of {folder?.files.length || "0"}</div>
				</div>
			</div>

			<div className="middle">
				<div className="left">
					<AlbumArt 
						fileId={file?.id || null}
						alt={file?.filename || "none"}
					/>

					<div className="track-info-2">
						<div className="track-title">{file?.title || (file?.filename && formatFileName(file?.filename)) || "[No Song Selected]"}</div>
						<div className="track-author">{file?.artist || "[Unknown]"} {file?.album && `- ${file.album}`}</div>
					</div>
				</div>

				<div className="right">
					<MiniQueue 
						selectedFolder={folder}
						selectedFile={file}
						selectFile={selectFile}
						isLoading={isLoading}
						selectFolder={selectFolder}
					/>
				</div>
			</div>

			<div className="bottom">
				<div className="progress-container">
					<div className="progress-time">
						{formatTime(currentTime)} / {formatTime(duration)}
					</div>
					<div className="progress-bar-container">
						<input 
							type="range"
							min="0"
							max={duration}
							value={currentTime}
							onChange={(e) => seek(Number(e.target.value))}
							className="progress-bar"
						/>
					</div>
				</div>

				<div className="controls">
					<button 
						className="last"
						onClick={handlePrevious}
					>
						{"◁"}
					</button>
					<button
						className="pause"
						onClick={isPlaying ? pause : play}
					>
						{isPlaying ? "❚❚" : "▶"}
					</button>
					<button
						className="next"
						onClick={handleNext}
					>
						{"▷"}
					</button>
				</div>
			</div>

			<div style={{ fontSize: '12px', opacity: 0.7, marginTop: '10px' }}>
				Cache: {audioElementCache.size}/{MAX_CACHE_SIZE} | 
				Preloading: {preloadingRef.current.size} | 
				Ready: {audioRef.current?.readyState || 0}/4
			</div>
		</div>
	);
};