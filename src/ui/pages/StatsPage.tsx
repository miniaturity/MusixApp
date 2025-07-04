
interface StatsPageProps {
	favorites: MP3File[];
}

export const StatsPage: React.FC<StatsPageProps> = ({ favorites }) => {
    


	return (
		<div className="stats">
			<div className="favorites">
				{favorites.map((file, index) => {
						return (
								<div className="favorites-item" id={String(index)}>
									<div>
										
									</div>
									<div>
										
									</div>
								</div>
						)
				})}
			</div>
		</div>
	)
}