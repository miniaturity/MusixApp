
import { useEffect, useState } from "react";

interface MiniQueueProps {
	selectedFolder: MP3Folder | null,
	selectedFile: MP3File | null,
	isLoading: boolean,
	selectFolder: () => void,
	selectFile: (file: MP3File, index: number, seek: (num: number) => void) => void,
	refreshFolder: () => void,
	seek: (num: number) => void,
}

interface Default {
	[key: string]: string,
}

export const MiniQueue: React.FC<MiniQueueProps> = ({ 
	selectedFolder, 
	selectedFile, 
	isLoading, 
	selectFolder, 
	selectFile,
	refreshFolder,
	seek
}) => {
	const [searchTerm, setSearchTerm] = useState<string>('');
	const [filter, setFilter] = useState<string>('S');

	const searchDefaults: Default = {
		A: "n artist...",
		S: " song...",
		B: "n album..."
	}


	const filteredFiles = selectedFolder?.files.filter(file => {
		if (!searchTerm) return true;
		
		const searchLower = searchTerm.toLowerCase();
		const title = (file.title || file.filename || '').toLowerCase();
		const artist = (file.artist || '[Unknown]').toLowerCase();
		
		return filter === 'S' ? title.includes(searchLower) : artist.includes(searchLower);
	}) || [];

	const handleChangeFilter = (): void => {
		setFilter(prev => prev === 'S' ? 'A' : prev === 'A' ? 'B' : 'S');
	}

	return (
		<div className="mini-queue"> 
			{!selectedFolder ? 
			<div className="folder-selector">
				{isLoading ? 
				<button className="loading-fs">
					Loading...
				</button> : 
				<button 
					className="button-fs"
					onClick={selectFolder}
				>
					Select a folder to begin.
				</button>}
			</div> : 
			<>
			<div className="q-controls">
					<button 
					className="change-folder"
					onClick={selectFolder}
					>
						⇫
					</button>
					<button 
					className="reload-folder"
					onClick={refreshFolder}
					>
						↻
					</button>
					<input
						type="text"
						id="q-search"
						placeholder={`Search a${searchDefaults[filter]}`}
						className="q-search"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
					<button
						className="q-filter"
						onClick={handleChangeFilter}
					>
						{filter}
					</button>
				</div>
			<div className="mq-list">
				
				{!isLoading ? filteredFiles.map((file) => {
					const originalIndex: number = selectedFolder.files.findIndex(f => f.id === file.id);

					return (
						<div 
						key={file.id}
						className={`mq-list-item ${selectedFile === file ? "current" : ""}`} 
						id={file.id}
						onClick={() => selectFile(file, originalIndex, () => seek(0))}
						>
							<div className="mq-list-item-index">
								<div className="mq-index-num">{originalIndex + 1}</div>
							</div>
							<div className="mq-list-item-title">
								{file.title || file.filename}
							</div>
							<div className="mq-list-item-author">
								{file.artist || "[Unknown]"} {file.album && `- ${file.album}`}
							</div>
						</div>
					)
				}) : 
				<div className="loading-fl">
					Loading {selectedFolder.files.length} songs
				</div>}
			</div> </>}
		</div>
	);
}