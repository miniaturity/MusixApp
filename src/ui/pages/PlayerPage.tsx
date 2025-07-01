// src/ui/pages/MP3PlayerPage.tsx
import React, { useEffect, useState } from 'react';
import { Player } from '../components/Player';

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
        // Reset selection when folder changes
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
      <div className="page-header">
        <h1>MP3 Player</h1>
        <div className="page-actions">
          <button onClick={selectFolder} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Select Folder'}
          </button>
          {mp3Folder && (
            <button onClick={refreshFolder} disabled={isLoading}>
              🔄 Refresh
            </button>
          )}
        </div>
      </div>

      {mp3Folder && (
        <div className="folder-info">
          <h3>📁 {mp3Folder.path}</h3>
          <p>{mp3Folder.files.length} MP3 files found</p>
        </div>
      )}

      <div className="player-layout">
        {selectedFile ? (
          <div className="player-section">
            <div className="player-controls">
              <button 
                onClick={playPrevious} 
                disabled={currentPlayingIndex <= 0}
                className="nav-button"
              >
                ⏮️ Previous
              </button>
              <button 
                onClick={playNext} 
                disabled={!mp3Folder || currentPlayingIndex >= mp3Folder.files.length - 1}
                className="nav-button"
              >
                Next ⏭️
              </button>
            </div>
            <Player 
              file={selectedFile} 
              onEnded={playNext}
            />
          </div>
        ) : (
          <div className="no-selection">
            <div className="no-selection-content">
              <span className="no-selection-icon">🎵</span>
              <h3>No song selected</h3>
              <p>Choose a song from the list to start playing</p>
            </div>
          </div>
        )}

        {mp3Folder ? (
          <div className="file-list">
            <div className="file-list-header">
              <h3>Songs ({mp3Folder.files.length})</h3>
            </div>
            <div className="file-list-container">
              {mp3Folder.files.map((file, index) => (
                <div 
                  key={file.id} 
                  className={`file-item ${index === currentPlayingIndex ? 'playing' : ''}`}
                  onClick={() => playFile(file, index)}
                >
                  <div className="file-main-info">
                    <div className="file-title">
                      {file.title || file.filename}
                    </div>
                    <div className="file-details">
                      {file.artist && <span className="file-artist">{file.artist}</span>}
                      {file.album && <span className="file-album">• {file.album}</span>}
                    </div>
                  </div>
                  <div className="file-meta">
                    <span className="duration">{formatDuration(file.duration)}</span>
                    <span className="size">{formatFileSize(file.size)}</span>
                    {index === currentPlayingIndex && (
                      <span className="playing-indicator">♪</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-content">
              <span className="empty-state-icon">📂</span>
              <h3>No folder selected</h3>
              <p>Select a folder containing MP3 files to get started</p>
              <button onClick={selectFolder} className="primary-button">
                Select MP3 Folder
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};