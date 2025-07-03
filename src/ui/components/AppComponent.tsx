import { Routes, Route, useLocation } from 'react-router'
import { MP3PlayerPage } from '../pages/PlayerPage';
import '../App.css'
import { NavBar } from './Navbar';

function AppContent() {
  const location = useLocation();

  return (
    <>
    <NavBar currentPath={location.pathname}/>
      <Routes>
        <Route index element={<MP3PlayerPage />}/>
      </Routes>
    </>
  )
}

export default AppContent;
