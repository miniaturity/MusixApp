const electron = require("electron");

electron.contextBridge.exposeInMainWorld("electron", {
    subscribeStatistics: (callback: (statistics: any) => void) => {
        return ipcOn("statistics", (stats)=>{
            callback(stats);
        })
    },
    getStaticData: () => ipcInvoke("getStaticData"),
    
    // MP3 functions
    selectMP3Folder: () => ipcInvoke("selectMP3Folder"),
    getCurrentMP3Folder: () => ipcInvoke("getCurrentMP3Folder"),
    scanMP3Folder: (folderPath?: string) => ipcInvoke("scanMP3Folder", folderPath),
    getMP3FileBuffer: (fileId: string) => ipcInvoke("getMP3FileBuffer", fileId),
} satisfies Window['electron'])

function ipcInvoke<Key extends keyof EventPayloadMapping>(
  key: Key,
  ...args: any[]
): Promise<EventPayloadMapping[Key]> {
  return electron.ipcRenderer.invoke(key, ...args);
}

function ipcOn<Key extends keyof EventPayloadMapping>(
  key: Key,
  callback: (payload: EventPayloadMapping[Key]) => void
) {
  const cb = (_: Electron.IpcRendererEvent, payload: any) => callback(payload);
  electron.ipcRenderer.on(key, cb);
  return () => electron.ipcRenderer.off(key, cb);
}

function ipcSend<Key extends keyof EventPayloadMapping>(
  key: Key,
  payload: EventPayloadMapping[Key]
) {
  electron.ipcRenderer.send(key, payload);
}