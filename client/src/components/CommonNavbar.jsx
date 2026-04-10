import React, { useState } from "react";
import logo from "../assets/logo.png";
import { Link } from "react-router-dom";

const CommonNavbar = () => {

  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-[#f3f3f3] w-[80%] md:max-w-7xl mx-auto rounded-lg md:rounded-full px-5 mt-10">

      <div className="flex justify-between items-center p-4">

       <div>
          <img src={logo} alt="Logo" className="h-10" />
       </div>

        <button
          className="md:hidden"
          onClick={() => setOpen(!open)}
        >
          ☰
        </button>

        {/* Desktop Menu */}
        <ul className="hidden md:flex space-x-6">
          <li className="cursor-pointer"><Link to="/">Home</Link></li>
          <li className="cursor-pointer"><Link to="#">About</Link></li>
          <li className="cursor-pointer"><Link to="/courses">Courses</Link></li>
          <li className="cursor-pointer"><Link to="#">Gallery</Link></li>
          <li className="cursor-pointer"><Link to="#">Contact</Link></li>
        </ul>

      </div>

      {/* Mobile Menu */}
      {open && (
        <ul className="md:hidden flex flex-col w-full bg-white border-t">
          <li className="p-3 border-b"><Link to="/">Home</Link></li>
          <li className="p-3 border-b"><Link to="#">About</Link></li>
          <li className="p-3 border-b"><Link to="/courses">Courses</Link></li>
          <li className="p-3 border-b"><Link to="#">Gallery</Link></li>
          <li className="p-3 border-b"><Link to="#">Contact</Link></li>
        </ul>
      )}

    </nav>
  );
};

export default CommonNavbar;