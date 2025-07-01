type Statistics = {
    cpuUsage: number;
    ramUsage: number;
    storageUsage: number;
};

type StaticData = {
    totalStorage: number;
    cpuModel: string;
    totalMemoryGB: number;
};

type MP3File = {
    id: string;
    filename: string;
    filepath: string;
    title?: string;
    artist?: string;
    album?: string;
    duration?: number;
    size: number;
    lastModified: Date;
};

type MP3Folder = {
    path: string;
    files: MP3File[];
};

type AlbumArtData = {
    format: string;
    data: number[];
} | null;

type EventPayloadMapping = {
    statistics: Statistics;
    getStaticData: StaticData;
    selectMP3Folder: string | null;
    getCurrentMP3Folder: MP3Folder | null;
    scanMP3Folder: MP3File[];
    getMP3FileBuffer: number[];
    getAlbumArt: AlbumArtData;
};

type UnsubscribeFunction = () => void;

interface Window {
    electron: {
        subscribeStatistics: (callback: (statistics: Statistics) => void) => UnsubscribeFunction;
        getStaticData: () => Promise<StaticData>;
        selectMP3Folder: () => Promise<string | null>;
        getCurrentMP3Folder: () => Promise<MP3Folder | null>;
        scanMP3Folder: (folderPath?: string) => Promise<MP3File[]>;
        getMP3FileBuffer: (fileId: string) => Promise<number[]>;
        getAlbumArt: (fileId: string) => Promise<AlbumArtData>;
    }
}