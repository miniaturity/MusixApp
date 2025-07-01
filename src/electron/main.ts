import { app, BrowserWindow } from "electron";
import path from 'path';
import { ipcMainHandle, isDev } from './util.js';
import { getPreloadPath } from "./pathResolver.js";
import { getStaticData, pollResources } from "./resourceManager.js";
import { MP3Manager } from "./FileManager.js";

const mp3Manager = new MP3Manager();

app.on("ready", () => {
    const mainWindow = new BrowserWindow({
        webPreferences: {
            preload: getPreloadPath(),
        },
        height: 650,
        width: 650,
    });
    
    if (isDev()) {
        mainWindow.loadURL('http://localhost:5173');
    } else {
        mainWindow.loadFile(path.join(app.getAppPath(), "/dist-react/index.html"));
    }

    pollResources(mainWindow);
    
    ipcMainHandle('getStaticData', () => {
        return getStaticData();
    });

    // MP3 handlers
    ipcMainHandle('selectMP3Folder', async () => {
        return await mp3Manager.selectFolder();
    });

    ipcMainHandle('getCurrentMP3Folder', async () => {
        return await mp3Manager.getCurrentFolder();
    });

    ipcMainHandle('scanMP3Folder', async (folderPath?: string) => {
        return await mp3Manager.scanFolder(folderPath);
    });

    ipcMainHandle('getMP3FileBuffer', async (fileId: string) => {
        const buffer = await mp3Manager.getFileBuffer(fileId);
        return Array.from(buffer); // Convert to array for IPC transfer
    });

    ipcMainHandle('getAlbumArt', (fileId: string) => {
        const albumArt = mp3Manager.getAlbumArt(fileId);
        if (!albumArt) {
            return null;
        }
        return {
            format: albumArt.format,
            data: Array.from(albumArt.data) // Convert Buffer to array for IPC transfer
        };
    });
});