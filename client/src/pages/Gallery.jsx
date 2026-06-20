import img1 from "../assets/campus1.png";
import img2 from "../assets/campus2.png";
import img3 from "../assets/campus3.png";

import img4 from "../assets/events1.png";
import img5 from "../assets/events2.png";
import img6 from "../assets/workshop1.png";
import galleryBg2 from "../assets/galleryBg2.png";
import { BadgeCheck, Building2, ShieldCheck, Users } from "lucide-react";


const Gallery = () => {
 

  const galleryItems = [
    { img: img1},
    { img: img2},
    { img: img3},
    { img: img4},
    { img: img5},
    { img: img6},
 
  ];

  return (
    <main className="bg-white text-gray-900">
      {/* Hero */}
      <section className="bg-gradient-to-br from-orange-50 via-white to-orange-100">
        <div className="mx-auto grid max-w-7xl px-4 items-center gap-10 px-4 py-16 text-center lg:text-left justify-items-center lg:grid-cols-2 lg:justify-items-between lg:py-24">
          <div>
            <h1 className="text-4xl font-extrabold md:text-5xl">Gallery</h1>
            
            <p className="mt-6 max-w-md text-lg leading-8 text-gray-600">
              Explore moments that inspire, capture experiences that matter, and
              celebrate our journey together.
            </p>
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

          <div className="relative flex justify-center">
            <div className="absolute h-64 w-64 rounded-full bg-orange-200 blur-3xl" />
            <img
              src={galleryBg2}
              alt="Gallery"
              className="relative w-full max-w-md object-contain"
            />
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="-mt-8 rounded-t-[3rem] bg-white px-4 py-14 shadow-sm">
        <div className="mx-auto max-w-7xl">
      

          {/* Images */}
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {galleryItems.map((item, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl shadow-lg"
              >
                <img
                  src={item.img}
                  alt={item.title}
                  className="h-64 w-full object-cover transition duration-500 group-hover:scale-110"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

               
              </div>
            ))}
          </div>

        
        </div>
      </section>

    

   
    </main>
  );
};

const FooterLinks = ({ title, links }) => (
  <div>
    <h3 className="mb-4 font-bold">{title}</h3>
    <ul className="space-y-2 text-sm text-gray-600">
      {links.map((link) => (
        <li key={link} className="hover:text-orange-500">
          {link}
        </li>
      ))}
    </ul>
  </div>
);

export default Gallery;