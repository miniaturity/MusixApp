// src/ui/pages/MP3PlayerPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Player } from '../components/Player';
import './PlayerPage.css'
import '../App.css'
import { NavBar } from '../components/Navbar';


export const MP3PlayerPage: React.FC = () => {
  const [mp3Folder, setMp3Folder] = useState<MP3Folder | null>(null);
  const [selectedFile, setSelectedFile] = useState<MP3File | null>(null);
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    if (!hasMounted) {
      console.log("Loading folder.")
      loadCurrentFolder();
      setHasMounted(true);
    }
  }, []);

  const loadCurrentFolder = async () => {
    try {
      setIsLoading(true);
      const folder = await window.electron.getCurrentMP3Folder();
      setMp3Folder(folder);
    } catch (error) {
      console.error('Error loading current folder:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectFolder = async () => {
    try {
      setIsLoading(true);
      const folderPath = await window.electron.selectMP3Folder();
      if (folderPath) {
        const folder = await window.electron.getCurrentMP3Folder();
        setMp3Folder(folder);
        if (folder?.files && folder?.files.length > 0) {
          setSelectedFile(folder.files[0]);
          setCurrentPlayingIndex(0);
        } else {
          setSelectedFile(null);
          setCurrentPlayingIndex(-1);
        }
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshFolder = async () => {
    if (mp3Folder) {
      try {
        setIsLoading(true);
        const files = await window.electron.scanMP3Folder(mp3Folder.path);
        setMp3Folder({ ...mp3Folder, files });
      } catch (error) {
        console.error('Error refreshing folder:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const playFile = (file: MP3File, index: number, seek: (num: number) => void) => {
    seek(0);
    setSelectedFile(file);
    setCurrentPlayingIndex(index);
  };

  const playNext = (seek: (num: number) => void) => {
    if (!mp3Folder || mp3Folder.files.length === 0) return;
    
    const nextIndex = (currentPlayingIndex + 1) % mp3Folder.files.length; // Loop back to start
    const nextFile = mp3Folder.files[nextIndex];
    
    if (nextFile) {
      playFile(nextFile, nextIndex, () => seek(0));
    }
  };

  const playPrevious = (seek: (num: number) => void) => {
    if (!mp3Folder || mp3Folder.files.length === 0) return;
    
    const prevIndex = currentPlayingIndex <= 0 
      ? mp3Folder.files.length - 1  // Loop to end
      : currentPlayingIndex - 1;
    const prevFile = mp3Folder.files[prevIndex];
    
    if (prevFile) {
      playFile(prevFile, prevIndex, () => seek(0));
    }
  };


  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return 'Unknown';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="page">
    
      <Player 
        file={selectedFile}
        folder={mp3Folder}
        last={playPrevious}
        next={playNext}
        selectFolder={selectFolder}
        selectFile={playFile}
        refreshFolder={refreshFolder}
      />

    </div>
  );
};