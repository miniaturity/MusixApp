import { useEffect, useState } from 'react'
import { HashRouter as Router, Routes, Route } from 'react-router'
import { MP3PlayerPage } from './pages/PlayerPage';
import './App.css'

function App() {

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
