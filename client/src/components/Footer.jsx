import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

const Footer = () => {
  return (
    <footer className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-5 py-12">
        
        {/* Top Section */}
        <div className="grid md:grid-cols-3 gap-10 border-b border-white/20 pb-10">

          {/* Logo */}
          <div>
            <img
              src={logo}
              alt="Study2India"
              className="bg-white p-2 rounded-lg h-16 mb-4"
            />

            <p className="text-sm text-gray-300 leading-6 max-w-sm">
              Together, let's guide the next generation toward informed
              choices, brighter careers, and a stronger future.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-semibold mb-4">
              Quick Links
            </h3>

            <ul className="space-y-2 text-gray-300">
              <li>
                <Link to="/" className="hover:text-[#f68c1e] transition">
                  Home
                </Link>
              </li>

              <li>
                <Link to="/about" className="hover:text-[#f68c1e] transition">
                  About Us
                </Link>
              </li>

              <li>
                <Link
                  to="/courses"
                  className="hover:text-[#f68c1e] transition"
                >
                  Courses
                </Link>
              </li>

              <li>
                <Link
                  to="/contact"
                  className="hover:text-[#f68c1e] transition"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xl font-semibold mb-4">
              Contact Us
            </h3>

            <div className="space-y-2 text-gray-300 text-sm">
              <p>📧 info@study2india.com</p>
              <p>🌐 www.study2india.com</p>
              <p>📞 +91 95269 23555</p>
            </div>
          </div>
        </div>

        {/* Branches */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-5 py-10 border-b border-white/20">
          
           <div>
            <h4 className="font-semibold text-[#f68c1e]">
               Head Office
              <br />
              Thiruvalla
            </h4>
            <p className="text-sm text-gray-300">
              +91 96458 38555
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-[#f68c1e]">
              Thodupuzha
            </h4>
            <p className="text-sm text-gray-300">
             
              +91 95269 23555
            </p>
          </div>

         

          <div>
            <h4 className="font-semibold text-[#f68c1e]">
              Kottayam
            </h4>
            <p className="text-sm text-gray-300">
              +91 97458 28555
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-[#f68c1e]">
              Thrissur
            </h4>
            <p className="text-sm text-gray-300">
              +91 99471 74555
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-[#f68c1e]">
              Kattapana
            </h4>
            <p className="text-sm text-gray-300">
              +91 70258 48586
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-[#f68c1e]">
              Kochi
            </h4>
            <p className="text-sm text-gray-300">
              +91 95269 89555
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-[#f68c1e]">
              Kollam
            </h4>
            <p className="text-sm text-gray-300">
              +91 99475 89555
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-[#f68c1e]">
              Kannur
            </h4>
            <p className="text-sm text-gray-300">
              +91 99471 74555
            </p>
          </div>
        </div>

        {/* Google Map */}
     <div className="mt-10">
  <iframe
    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3936.3954770238474!2d76.5746693!3d9.3866442!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b0625001cf26701%3A0x87aa7d34b3366d77!2sStudy%202%20India!5e0!3m2!1sen!2sin!4v1781937350553!5m2!1sen!2sin"
    width="100%"
    height="400"
    style={{ border: 0 }}
    allowFullScreen
    loading="lazy"
    referrerPolicy="no-referrer-when-downgrade"
    className="rounded-2xl"
    title="Study2India Location"
  />
</div>

        {/* Copyright */}
        <div className="pt-8 text-center text-gray-400 text-sm">
          © 2026 Study2India. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;