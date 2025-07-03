import { Routes, Route, useLocation } from 'react-router'
import { MP3PlayerPage } from '../pages/PlayerPage';
import '../App.css'

function AppContent() {
  const location = useLocation();

  return (
    <>
      <Routes>
        <Route index element={<MP3PlayerPage path={location.pathname}/>}/>
      </Routes>
    </>
  )
}

export default AppContent;
