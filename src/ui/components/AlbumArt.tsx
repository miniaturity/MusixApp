import React, { useEffect, useState } from 'react';
import defaultAlbumArt from '../assets/m6.png';

interface AlbumArtProps {
	fileId: string | null;
	alt?: string;
	className?: string;
	style?: React.CSSProperties;
	fallbackSrc?: string;
}

export const AlbumArt: React.FC<AlbumArtProps> = ({
	fileId,
	alt = "Album Art",
	className,
	style,
	fallbackSrc = defaultAlbumArt
}) => {
	const [imageSrc, setImageSrc] = useState<string>(fallbackSrc);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(false);

	useEffect(() => {
		let isMounted = true;

		const loadAlbumArt = async () => {
			if (!fileId) {
				setImageSrc(fallbackSrc);
				setIsLoading(false);
				return;
			}

			try {
				setIsLoading(true);
				setError(false);

				const albumArtData = await window.electron.getAlbumArt(fileId);

				if (!isMounted) return;

				if (albumArtData && albumArtData.data) {
					const uint8 = new Uint8Array(albumArtData.data);
					const blob = new Blob([uint8], { type: `image/${albumArtData.format}`})
					const oUrl = URL.createObjectURL(blob);
					setImageSrc(oUrl);
				} else {
					setImageSrc(fallbackSrc);
				}
			} catch (err) {
				console.error('Error loading album art:', err);
				if (isMounted) {
					setError(true);
					setImageSrc(fallbackSrc);
				}
			} finally {
				if (isMounted) setIsLoading(false);
			}
		};

		loadAlbumArt();

		return () => {
			isMounted = false;
			if (imageSrc && imageSrc.startsWith('blob:')) {
				URL.revokeObjectURL(imageSrc);
			}
		}
	}, [fileId, fallbackSrc]);

	useEffect(() => {
		return () => {
			if (imageSrc && imageSrc.startsWith('blob:'))
				URL.revokeObjectURL(imageSrc);
		}
	}, [imageSrc])

	const handleImageError = () => {
		if (!error) {
			setError(true);
			setImageSrc(fallbackSrc);
		}
	}

	return (
		<>
			<div className={`aa-container ${className || ''}`} style={style}>
				{isLoading && <>
					<div className="aa-loading">
						<img 
							src={fallbackSrc}
							alt={alt}
							className={`aa-loading-img`}
							style={{
								display: isLoading ? '' : 'none'
							}}
						/>
					</div>
				</>}
				<img 
					src={imageSrc}
					alt={alt}
					onError={handleImageError}
					className={`aa-img`}
					style={{
						display: isLoading ? 'none' : ''
					}}
				/>
			</div>
		</>
	);
}