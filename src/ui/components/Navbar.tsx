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
		},
		{
			icon: "◉",
			nav: "/s"
		}
	]
	const navigate = useNavigate();


	return (
		<>
			<div className="navbar">
					{buttons.map((button) => (<button 
					className={`navbar-button${currentPath === button.nav ? '-current' : ''}`}
					onClick={() => navigate(button.nav)}
					key={button.icon}
					>
						{button.icon}
					</button>))}
					
			</div>
		</>
	)
}