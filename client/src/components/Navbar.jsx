import React, { useState } from "react";
import logo from "../assets/logo.png";
import { Link } from "react-router-dom";

const Navbar = () => {

  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-white/45 w-full mx-auto px-5">

      <div className="flex justify-between items-center p-4 max-w-7xl mx-auto">

       <Link to="/"><div>
      
          <img src={logo} alt="Logo" className="h-10" />
       </div>
       </Link>

        <button
          className="md:hidden"
          onClick={() => setOpen(!open)}
        >
          ☰
        </button>

        {/* Desktop Menu */}
        <ul className="hidden md:flex space-x-6">
          <li className="cursor-pointer hover:border-t-2 border-orange-500"><Link to="/">Home</Link></li>
          <li className="cursor-pointer hover:border-t-2 border-orange-500"><Link to="/about">About</Link></li>
          <li className="cursor-pointer hover:border-t-2 border-orange-500"><Link to="/courses">Courses</Link></li>
          <li className="cursor-pointer hover:border-t-2 border-orange-500"><Link to="/gallery">Gallery</Link></li>
          <li className="cursor-pointer hover:border-t-2 border-orange-500"><Link to="/contact">Contact</Link></li>
        </ul>

      </div>

      {/* Mobile Menu */}
      {open && (
        <ul className="md:hidden flex flex-col w-full bg-white border-t">
          <li className="p-3 border-b"><Link to="/">Home</Link></li>
          <li className="p-3 border-b"><Link to="/about" onClick={()=>setOpen(false)}>About</Link></li>
          <li className="p-3 border-b"><Link to="/courses" onClick={()=>setOpen(false)}>Courses</Link></li>
          <li className="p-3 border-b"><Link to="/gallery" onClick={()=>setOpen(false)}>Gallery</Link></li>
          <li className="p-3 border-b"><Link to="/contact" onClick={()=>setOpen(false)}>Contact</Link></li>
        </ul>
      )}

    </nav>
  );
};

export default Navbar;