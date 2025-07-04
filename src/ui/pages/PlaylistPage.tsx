import './PlaylistPage.css';
import { dialog } from 'electron';

interface Playlist {
	name: string;
	img?:  {
	format: string;
	data: Buffer;
	}
	content: MP3File[];
}

export const PlaylistPage: React.FC = () => {

	return (
		<div className="page">
			
		</div>
	)
}

/* 

playlist



*/