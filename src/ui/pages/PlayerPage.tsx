// src/ui/pages/MP3PlayerPage.tsx
import React, { useEffect, useState } from 'react';
import { Player } from '../components/Player';
import './PlayerPage.css'

export const MP3PlayerPage: React.FC = () => {
  const [mp3Folder, setMp3Folder] = useState<MP3Folder | null>(null);
  const [selectedFile, setSelectedFile] = useState<MP3File | null>(null);
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load current folder on page load
    loadCurrentFolder();
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
        // Reset selection when folder changes!
        setSelectedFile(null);
        setCurrentPlayingIndex(-1);
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

  const playFile = (file: MP3File, index: number) => {
    setSelectedFile(file);
    setCurrentPlayingIndex(index);
  };

  const playNext = () => {
    if (mp3Folder && currentPlayingIndex < mp3Folder.files.length - 1) {
      const nextIndex = currentPlayingIndex + 1;
      playFile(mp3Folder.files[nextIndex], nextIndex);
    }
  };

  const playPrevious = () => {
    if (mp3Folder && currentPlayingIndex > 0) {
      const prevIndex = currentPlayingIndex - 1;
      playFile(mp3Folder.files[prevIndex], prevIndex);
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
      />

    </div>
  );
};