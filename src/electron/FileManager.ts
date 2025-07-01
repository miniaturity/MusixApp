import fs from 'fs';
import path from 'path';
import { dialog } from 'electron';
import * as mm from 'music-metadata';

export interface MP3File {
  id: string;
  filename: string;
  filepath: string;
  title?: string;
  artist?: string;
  album?: string;
  duration?: number;
  size: number;
  lastModified: Date;
}

export interface MP3Folder {
  path: string;
  files: MP3File[];
}

export class MP3Manager {
  private currentFolder: string | null = null;
  private files: MP3File[] = [];

  async selectFolder(): Promise<string | null> {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select MP3 Folder'
    });

    if (result.canceled || !result.filePaths.length) {
      return null;
    }

    this.currentFolder = result.filePaths[0];
    await this.scanFolder();
    return this.currentFolder;
  }

  async scanFolder(folderPath?: string): Promise<MP3File[]> {
    const targetPath = folderPath || this.currentFolder;
    if (!targetPath) {
      throw new Error('No folder selected');
    }

    this.files = [];
    
    try {
      const entries = await fs.promises.readdir(targetPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isFile() && this.isMP3File(entry.name)) {
          const filepath = path.join(targetPath, entry.name);
          const mp3File = await this.createMP3FileInfo(filepath);
          this.files.push(mp3File);
        }
      }
    } catch (error) {
      console.error('Error scanning folder:', error);
      throw error;
    }

    return this.files;
  }

  private isMP3File(filename: string): boolean {
    return path.extname(filename).toLowerCase() === '.mp3';
  }

  private async createMP3FileInfo(filepath: string): Promise<MP3File> {
    const stats = await fs.promises.stat(filepath);
    const filename = path.basename(filepath);
    const id = this.generateId(filepath);

    const mp3File: MP3File = {
      id,
      filename,
      filepath,
      size: stats.size,
      lastModified: stats.mtime
    };

    // Extract metadata
    try {
      const metadata = await mm.parseFile(filepath);
      mp3File.title = metadata.common.title;
      mp3File.artist = metadata.common.artist;
      mp3File.album = metadata.common.album;
      mp3File.duration = metadata.format.duration;
    } catch (error) {
      console.warn(`Could not extract metadata for ${filename}:`, error);
    }

    return mp3File;
  }

  private generateId(filepath: string): string {
    return Buffer.from(filepath).toString('base64');
  }

  getCurrentFolder(): MP3Folder | null {
    if (!this.currentFolder) {
      return null;
    }

    return {
      path: this.currentFolder,
      files: this.files
    };
  }

  getFileById(id: string): MP3File | null {
    return this.files.find(file => file.id === id) || null;
  }

  async getFileBuffer(id: string): Promise<Buffer> {
    const file = this.getFileById(id);
    if (!file) {
      throw new Error('File not found');
    }

    return fs.promises.readFile(file.filepath);
  }
}