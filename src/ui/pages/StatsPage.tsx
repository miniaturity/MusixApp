import { useEffect, useState } from "react";


export const StatsPage: React.FC = () => {
  const [favorites, setFavorites] = useState<MP3File[]>([]);

	const f = localStorage.getItem('favorites');
	if (f) setFavorites(JSON.parse(f));
	

	return (
		<div className="stats">
			<div className="favorites">
				<div className="favorites-controls">
					
				</div>
				{favorites.map((file, index) => {
					return (
						<div className="favorites-item" id={String(index)}>
							<div className="favorites-item-name">
								{file.filename}
							</div>
							<div className="favorites-item-author">
								{file.artist || "[Unknown]"} {file.album && `- ${file.album}`}
							</div>
						</div>
					)
				})}
			</div>
		</div>
	)
}