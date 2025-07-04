import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AlbumArt } from './AlbumArt';
import { MiniQueue } from './MiniQueue';
import { IconContext } from "react-icons"
import { BiSolidVolumeFull, BiPlusCircle } from "react-icons/bi";

interface MP3PlayerProps {
	file: MP3File | null;
	onEnded?: (seek: (num: number) => void, repeatMode: number) => void;
	last: (seek: (num: number) => void) => void;
	next: (seek: (num: number) => void) => void;
	folder: MP3Folder | null;
	selectFolder: () => void;
	selectFile: (file: MP3File, index: number, seek: (num: number) => void) => void;
	refreshFolder: () => void;
}

const audioElementCache = new Map<string, HTMLAudioElement>();
const MAX_CACHE_SIZE = 5;
const cacheOrder: string[] = [];

const addToCache = (fileId: string, audio: HTMLAudioElement) => {
	const existingIndex = cacheOrder.indexOf(fileId);
	if (existingIndex !== -1) {
		cacheOrder.splice(existingIndex, 1);
	}

	cacheOrder.unshift(fileId);
	audioElementCache.set(fileId, audio);

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
	refreshFolder,
}) => {
	const [isPlaying, setIsPlaying] = useState<boolean>(false);
	const [currentTime, setCurrentTime] = useState<number>(0);
	const [duration, setDuration] = useState<number>(0);
	const [volume, setVolume] = useState<number>(1);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [loadProgress, setLoadProgress] = useState<number>(0);
	const [repeatMode, setRepeatMode] = useState<number>(0);


	const audioRef = useRef<HTMLAudioElement | null>(null);
	const currentFileIdRef = useRef<string | null>(null);
	const preloadingRef = useRef<Set<string>>(new Set());
	const shouldAutoPlayRef = useRef<boolean>(false);
	const repeatModeRef = useRef<number>(0);

	useEffect(() => {
    repeatModeRef.current = repeatMode;
	}, [repeatMode]);

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

		// Get file buffer and create blob URL - this is very much faster than AudioContext
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
			// Stop current audio if playing
			if (audioRef.current) {
				audioRef.current.pause();
				setIsPlaying(false);
			}

			const audio = await createAudioElement(file.id);
			
			// Set up event listeners
			const handleLoadedMetadata = () => {
				setDuration(audio.duration || 0);
				setCurrentTime(audio.currentTime);
				setIsLoading(false);
				setLoadProgress(100);
				
				// Auto-play if requested (for next/previous navigation)
				if (shouldAutoPlayRef.current) {
					shouldAutoPlayRef.current = false;
					play();
				}
			};

			const handleTimeUpdate = () => {
				setCurrentTime(audio.currentTime);
			};

			const handleEnded = () => {
				if (repeatModeRef.current === 0) {
					setIsPlaying(false);
					shouldAutoPlayRef.current = true;
					next?.(() => seek(0)); // Auto-advance to next track
				} else if (repeatModeRef.current === 1) {					
					seek(0);
					play();
				}
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
				
				// Auto-play if requested and not already handled by loadedmetadata
				if (shouldAutoPlayRef.current && audio.readyState >= 3) {
					shouldAutoPlayRef.current = false;
					play();
				}
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
			shouldAutoPlayRef.current = false; // Reset on error
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

		audioElementCache.forEach(audio => {
        audio.volume = newVolume;
    });
	};

	const handleNext = () => {
		console.log(currentTime);
		stop();
		shouldAutoPlayRef.current = true;
		next?.(() => seek(0));
	};

	const handlePrevious = () => {
		if (currentTime < 5) {
			stop();
			shouldAutoPlayRef.current = true;
			last?.(() => seek(0));
		} else {
			seek(0);
		}
	};

	const formatFileName = (n: string): string => {
		return n.split('.')[0].slice(0, 30);
	}

	const formatArtist = (a: string | undefined): string | null => {
		if (!a) return null;
		return a.slice(0, 15);
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

	const now = new Date();
	const formattedDateUS = new Intl.DateTimeFormat('en-US').format(now);
	const formattedHours = String(now.getHours()).padStart(2, '0');
	const formattedMinutes = String(now.getMinutes()).padStart(2, '0');
	const formattedSeconds = String(now.getSeconds()).padStart(2, '0');
	const nowTime = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
	const timedMessage = [
		{
			msg: "Good morning",
			req: Number(formattedHours) < 12
		},
		{
			msg: "Good afternoon",
			req: Number(formattedHours) >= 12 && Number(formattedHours) < 18
		},
		{
			msg: "Good evening",
			req: Number(formattedHours) >= 18
		}
	]

	const msg = timedMessage.find(item => item.req)?.msg || "Hello";

	return (
		<div className="player">
			<div className="top">
				<div className="track-info">
					<div className="track-index">{msg}, {"<user>"}!</div>
					<div className="date">{formattedDateUS} {nowTime}</div>
				</div>
			</div>

			<div className="middle">
				<div className="left">
					<AlbumArt 
						fileId={file?.id || null}
						alt={file?.filename || "none"}
					/>
					<div className="track-info-2-container">
						<div className="track-info-2">
							<div className="track-title">{file?.title || (file?.filename && formatFileName(file?.filename)) || "[No Song Selected]"}</div>
							<div className="track-author">{formatArtist(file?.artist) || "[Unknown]"} {file?.album && `- ${formatArtist(file.album)}`}</div>
						</div>
						<div className="add-to">
							<button
								className="playlist-button"
							>
								<IconContext.Provider value={{ color: 'var(--text-color)'}}>
									<BiPlusCircle />
								</IconContext.Provider>
							</button>
						</div>
					</div>
				</div>

				<div className="right">
				
					<MiniQueue 
						selectedFolder={folder}
						selectedFile={file}
						selectFile={selectFile}
						selectFolder={selectFolder}
						isLoading={isLoading}
						refreshFolder={refreshFolder}
						seek={seek}
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
						/>
					</div>
				</div>
				<div className="cp-container">
					<div className="c-space-taker">
							a
					</div>
					<div className="controls">
						
						<button className="last" style={{visibility: 'hidden'}}>
							{"."}
						</button>
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
						<button
							className="repeat"
							onClick={() => {
								const newMode: number = repeatMode === 0 ? 1 : 0
								setRepeatMode(newMode);
								console.log(newMode);
							}}
							style={{
								color: `${repeatMode === 0 ? 'var(--text-color)' : 'var(--primary-color)'}`
							}}
						>
							{"↻"}
						</button>
					</div>
					<div className="volume-sec">
						<div className="volume-bar-container">
							<button className="volume-icon">
								<IconContext.Provider value={{ color: "var(--text-color)" }}>
									<BiSolidVolumeFull />
								</IconContext.Provider>
							</button>
							<input 
								type="range"
								className="volume-bar"
								value={volume * 100}
								min="0"
								max="100"
								onChange={(e) => changeVolume(Number(e.target.value) / 100)}
							/>
						</div>
					</div>
				</div>
			</div>
			
		</div>
	);
};