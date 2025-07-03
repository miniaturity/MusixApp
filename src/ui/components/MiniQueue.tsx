interface MiniQueueProps {
	selectedFolder: MP3Folder | null,
	selectedFile: MP3File | null,
	isLoading: boolean,
	selectFolder: () => void,
	selectFile: (file: MP3File, index: number) => void,
}

export const MiniQueue: React.FC<MiniQueueProps> = ({ 
	selectedFolder, 
	selectedFile, 
	isLoading, 
	selectFolder, 
	selectFile,
}) => {
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
			<div className="mq-list">
				{!isLoading ? selectedFolder.files.map((file, index) => {
					return (
						<div 
						className={`mq-list-item ${selectedFile === file ? "current" : ""}`} 
						id={file.id}
						onClick={() => selectFile(file, index)}
						>
							<div className="mq-list-item-index">
								{index + 1}
							</div>
							<div className="mq-list-item-title">
								{file.title || file.filename}
							</div>
							<div className="mq-list-item-author">
								{file.artist || "[Unknown]"}
							</div>
						</div>
					)
				}) : 
				<div className="loading-fl">
					Loading {selectedFolder.files.length} songs
				</div>}
			</div>}
		</div>
	);
}