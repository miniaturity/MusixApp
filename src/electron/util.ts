import { ipcMain, WebContents, WebFrameMain } from "electron";
import { getUIPath } from "./pathResolver.js";
import { pathToFileURL } from "url";

export function isDev(): boolean {
    return process.env.NODE_ENV === 'development';
}

// Overloaded function signatures to support both sync and async handlers!!!!
export function ipcMainHandle<Key extends keyof EventPayloadMapping>(
    key: Key, 
    handler: () => EventPayloadMapping[Key] | Promise<EventPayloadMapping[Key]>
): void;

export function ipcMainHandle<Key extends keyof EventPayloadMapping, TArgs extends any[]>(
    key: Key, 
    handler: (...args: TArgs) => EventPayloadMapping[Key] | Promise<EventPayloadMapping[Key]>
): void;

export function ipcMainHandle<Key extends keyof EventPayloadMapping>(
    key: Key, 
    handler: (...args: any[]) => EventPayloadMapping[Key] | Promise<EventPayloadMapping[Key]>
) {
    ipcMain.handle(key, async (event, ...args) => {
        if (!event.senderFrame) {
            throw new Error('Event has no sender frame');
        }
        validateEventFrame(event.senderFrame); 
        return await handler(...args);
    });
}

export function ipcWebContentsSend<Key extends keyof EventPayloadMapping>(
    key: Key,
    webContents: WebContents,
    payload: EventPayloadMapping[Key]
) {
    webContents.send(key, payload);
}

export function validateEventFrame(frame: WebFrameMain) {
  if (isDev() && new URL(frame.url).host === 'localhost:5173') {
    return;
  }
  if (frame.url !== pathToFileURL(getUIPath()).toString()) {
    throw new Error('Malicious event');
  }
}