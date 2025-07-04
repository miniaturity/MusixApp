import { Routes, Route, useLocation } from 'react-router'
import { MP3PlayerPage } from '../pages/PlayerPage';
import '../App.css'
import { NavBar } from './Navbar';
import { useState } from 'react';

function AppContent() {
  const location = useLocation();
  const [favorites, setFavorites] = useState([]);

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
