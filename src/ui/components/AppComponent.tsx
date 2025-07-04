import { Routes, Route, useLocation } from 'react-router'
import { MP3PlayerPage } from '../pages/PlayerPage';
import '../App.css'
import { NavBar } from './Navbar';
import { useState } from 'react';
import { StatsPage } from '../pages/StatsPage';

function AppContent() {
  const location = useLocation();

  return (
    <>
    <NavBar currentPath={location.pathname}/>
      <Routes>
        <Route index element={<MP3PlayerPage />}/>
        <Route path="/stats" element={<StatsPage />}/>
      </Routes>
    </>
  )
}

export default AppContent;
