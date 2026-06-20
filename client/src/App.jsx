import React from 'react'
import Home from './pages/Home'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Courses from './pages/Courses'
import Topbar from './components/Topbar'
import Footer from './components/Footer'
import Navbar from './components/Navbar'
import About from './pages/About'
import Gallery from './pages/Gallery'
import ContactPage from './pages/ContactPage'




const App = () => {
  return (
    <Router>
      <Topbar />
       <Navbar />
      
      
  
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/courses" element={<Courses />} />
             <Route path="/about" element={<About />} />
             <Route path="/gallery" element={<Gallery />} />
                <Route path="/contact" element={<ContactPage />} />
      </Routes>
        <Footer />
    </Router>
  )
}

export default App
