import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
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
      
    </>
  )
}

export default App
