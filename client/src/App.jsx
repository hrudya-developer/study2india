import React from 'react'
import Home from './pages/Home'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Courses from './pages/Courses'
import Topbar from './components/Topbar'
import Footer from './components/Footer'




const App = () => {
  return (
    <Router>
      <Topbar />
      
      
  
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/courses" element={<Courses />} />
      </Routes>
        <Footer />
    </Router>
  )
}

export default App
