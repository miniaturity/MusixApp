import { useNavigate } from "react-router";
import { BiCog, BiMusic, BiSolidPlaylist, BiEditAlt, BiHeadphone } from "react-icons/bi";
import { ReactElement } from "react";
import { IconContext } from "react-icons";
import '../App.css'

interface NavBarProps {
    currentPath: string
}

export const NavBar: React.FC<NavBarProps> = ({
    currentPath
}) => {
	interface ButtonsI {
		icon: ReactElement;
		nav: string;
	}

	const buttons: ButtonsI[] = [
		{
			icon: <IconContext.Provider value={{ color: 'var(--text-color)'}}><BiMusic /></IconContext.Provider>,
			nav: "/"
		},
		{
			icon: <IconContext.Provider value={{ color: 'var(--text-color)'}}><BiSolidPlaylist /></IconContext.Provider>,
			nav: "/playlist"
		},
		{
			icon: <IconContext.Provider value={{ color: 'var(--text-color)'}}><BiEditAlt /></IconContext.Provider>,
			nav: "/edit"
		},
		{
			icon: <IconContext.Provider value={{ color: 'var(--text-color)'}}><BiHeadphone /></IconContext.Provider>,
			nav: "/stats"
		},
		{
			icon: <IconContext.Provider value={{ color: 'var(--text-color)'}}><BiCog /></IconContext.Provider>,
			nav: "/settings"
		},
	]
	const navigate = useNavigate();


	return (
		<>
			<div className="navbar">
					{buttons.map((button) => (<button 
					className={`navbar-button${currentPath === button.nav ? '-current' : ''}`}
					onClick={() => navigate(button.nav)}
					key={button.nav}
					>
						{button.icon}
					</button>))}
					
			</div>
		</>
	)
}