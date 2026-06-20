import {
  GraduationCap,
  Building2,
  Users,
  BadgeCheck,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import hero1 from "../assets/hero1.png";
import hero2 from "../assets/hero2.png";
import { Link } from "react-router-dom";

export default function HeroSection() {
  return (
    <>
      <section className="relative overflow-hidden min-h-screen">
        {/* Mobile Background */}
        <div
          className="absolute inset-0 lg:hidden bg-cover bg-center"
          style={{ backgroundImage: `url(${hero2})` }}
        />

        {/* Desktop Background */}
        <div
          className="absolute inset-0 hidden lg:block bg-cover bg-right"
          style={{ backgroundImage: `url(${hero1})` }}
        />

   

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 items-center min-h-[calc(100vh-120px)] py-10 lg:py-0">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 mt-5 rounded-full bg-orange-50 border border-orange-100 px-5 py-2 text-orange-600 font-normal text-sm md:text-sm">
                Guiding Students. Shaping Futures.
              </div>

              <h1 className="mt-6 font-bold leading-loose text-white lg:text-black">
                <span className="block text-4xl sm:text-5xl lg:text-6xl">
                  Empowering
                </span>

                <span className="block text-4xl sm:text-5xl lg:text-6xl">
                  Students.
                </span>

                <span className="block text-4xl sm:text-5xl lg:text-6xl text-orange-500">
                  Enabling
                </span>

                <span className="block text-4xl sm:text-5xl lg:text-6xl">
                  Futures.
                </span>
              </h1>

              <p className="mt-6 text-base md:text-base text-white lg:text-slate-900 max-w-xl mx-auto lg:mx-0">
                Your gateway to South India's most trusted colleges and career
                opportunities. Discover the right path with expert guidance.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center lg:justify-start">
                <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full font-semibold flex items-center justify-center gap-2 transition">
                  Get Started
                  <ArrowRight size={18} />
                </button>

                <Link to="/courses"><button className="border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white px-6 py-3 rounded-full font-semibold flex items-center justify-center gap-2 transition">
                  Explore Courses
                  <GraduationCap size={18} />
                </button></Link>
              </div>

              <div className="mt-13 mb-10 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
                <div className="bg-white/95 backdrop-blur rounded-2xl p-5 text-center shadow-lg">
                  <Building2 className="mx-auto text-orange-500 mb-2" />
                  <h3 className="font-bold text-2xl">200+</h3>
                  <p className="text-sm text-slate-500">Top Colleges</p>
                </div>

                <div className="bg-white/95 backdrop-blur rounded-2xl p-5 text-center shadow-lg">
                  <Users className="mx-auto text-orange-500 mb-2" />
                  <h3 className="font-bold text-2xl">10K+</h3>
                  <p className="text-sm text-slate-500">Students</p>
                </div>

                <div className="bg-white/95 backdrop-blur rounded-2xl p-5 text-center shadow-lg">
                  <BadgeCheck className="mx-auto text-orange-500 mb-2" />
                  <h3 className="font-bold text-2xl">15+</h3>
                  <p className="text-sm text-slate-500">Years</p>
                </div>

                <div className="bg-white/95 backdrop-blur rounded-2xl p-5 text-center shadow-lg">
                  <ShieldCheck className="mx-auto text-orange-500 mb-2" />
                  <h3 className="font-bold text-2xl">98%</h3>
                  <p className="text-sm text-slate-500">Success</p>
                </div>
              </div>
            </div>

            {/* Empty desktop column */}
            <div className="hidden lg:block" />
          </div>
        </div>
      </section>

      <a
        href="https://wa.me/919645838555"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 z-50 flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#25D366] text-white shadow-xl hover:scale-110 transition"
      >
        <FaWhatsapp className="text-3xl" />
      </a>
    </>
  );
}