import { useEffect, useState } from 'react'
import { HashRouter as Router, Routes, Route } from 'react-router'
import { MP3PlayerPage } from './pages/PlayerPage';
import './App.css'

function App() {


  useEffect(() => {
    const unsub = window.electron.subscribeStatistics((stats) => console.log(stats));
    return unsub;
  }, []);

  const formatPercent = (p: number): string => {
    return `${Math.ceil(p * 100)}%`
  }

  return (
    <>
      <Router>
        <Routes>
          <Route index element={<MP3PlayerPage />}/>
        </Routes>
      </Router>
    </>
  )
}

export default App
