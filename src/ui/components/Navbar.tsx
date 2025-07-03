import { useNavigate } from "react-router"

interface NavBarProps {
    currentPath: string
}

export const NavBar: React.FC<NavBarProps> = ({
    currentPath
}) => {
	const buttons = [
		{
			icon: "♪",
			nav: "/"
		}
	]
	const navigate = useNavigate();


	return (
		<>
			<footer className="navbar">
					{buttons.map((button) => (<button 
					className={`navbar-button${currentPath === button.nav ? '-current' : ''}`}
					onClick={() => navigate(button.nav)}
					>
						{button.icon}
					</button>))}
			</footer>
		</>
	)
}