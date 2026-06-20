import students from "../assets/students.png";

const About = () => {
  return (
    <main className="w-full bg-gray-100 text-black">
     

     

      {/* Hero */}
      <section className="bg-orange-50/40 max-w-7xl mx-auto px-4">
        <div className="max-w-7xl mx-auto px-4 py-14 lg:py-20 grid lg:grid-cols-2 justify-items-center lg:justify-items-start gap-10 items-center text-center lg:text-left">
          <div>
            <span className="inline-block px-6 py-2 rounded-full border border-orange-200 text-orange-500 text-sm font-medium mb-6">
              ABOUT US
            </span>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-5">
              About Study<span className="text-orange-500">2</span>India
            </h2>

            <h3 className="text-xl sm:text-xl font-semibold text-orange-500 mb-6">
              Guiding Students. Shaping Futures.
            </h3>

            <p className="text-gray-700 leading-6 max-w-xl mb-8">
              At Study2India, we believe that every student deserves the right
              guidance to build a successful future. We help students discover
              the best academic opportunities and make informed decisions about
              their higher education journey.
            </p>

            <button className="bg-orange-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-orange-600 transition">
              Read More →
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-orange-300 rounded-[40%] blur-3xl opacity-30" />
            <img
              src={students}
              alt="Students"
              className="relative w-full max-w-xl mx-auto"
            />
          </div>
        </div>
      </section>

   

      {/* What We Offer */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <SectionTitle>
          What <span className="text-orange-500">We Offer</span>
        </SectionTitle>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5 mt-10">
          {[
            ["🎓", "College Admissions Guidance"],
            ["📖", "Course Selection Support"],
            ["👨‍💼", "Career Counseling"],
            ["🤝", "Trusted College Partnerships"],
            ["📄", "Application Assistance"],
          ].map(([icon, title]) => (
            <div
              key={title}
              className="border border-orange-100 rounded-xl p-6 text-center bg-orange-50/30 hover:shadow-lg transition"
            >
              <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-2xl">
                {icon}
              </div>
              <h3 className="font-bold mb-3">{title}</h3>
              <p className="text-sm text-gray-700 leading-6">
                Expert support to help students make confident academic and
                career decisions.
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <SectionTitle>
          Why Choose <span className="text-orange-500">Study2India?</span>
        </SectionTitle>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8 mt-12">
          {[
            ["👥", "Experienced Counselors"],
            ["🛡️", "Trusted Network"],
            ["🙋", "Student-Centric Approach"],
            ["🤲", "End-to-End Support"],
            ["✅", "Transparent Guidance"],
          ].map(([icon, title]) => (
            <div key={title} className="text-center">
              <div className="text-4xl mb-4">{icon}</div>
              <h3 className="font-bold mb-3">{title}</h3>
              <p className="text-sm text-gray-700 leading-6">
                We provide reliable guidance focused on every student’s goals.
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Commitment */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="bg-orange-50 rounded-3xl p-8 lg:p-12 grid lg:grid-cols-3 gap-8 items-center">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-orange-500 mb-4">
              Our Commitment
            </h2>
            <p className="text-gray-700 leading-8 mb-5">
              We are committed to providing dependable guidance, accurate
              information, and unwavering support to help students achieve their
              academic and career dreams.
            </p>
            <h3 className="text-xl font-bold mb-2">
              Let’s Build Your Future Together
            </h3>
            <p className="text-orange-500 font-semibold">
              Your future starts with the right decision today.
            </p>
          </div>

          <div className="space-y-4 text-gray-700">
            <p>📞 +91 95269 23555</p>
            <p>✉️ info@study2india.com</p>
            <p>🌐 www.study2india.com</p>
          </div>
        </div>
      </section>
    </main>
  );
};

const InfoCard = ({ icon, title, children }) => (
  <div className="bg-orange-50/60 rounded-2xl p-8 shadow-sm">
    <div className="w-16 h-16 rounded-full bg-orange-500 text-white flex items-center justify-center text-2xl mb-6">
      {icon}
    </div>
    <h3 className="text-2xl font-bold mb-4">{title}</h3>
    <p className="text-gray-700 leading-7">{children}</p>
  </div>
);

const SectionTitle = ({ children }) => (
  <h2 className="text-3xl sm:text-4xl font-bold text-center">{children}</h2>
);

export default About;