import React from "react";

export default function ContactPage() {
  const items = [
    {
      icon: "📍",
      title: "Our Address",
      text: ["4th Floor, KSRTC Bus Terminal Complex, Thiruvalla"],
    },
    {
      icon: "✉️",
      title: "Email Us",
      text: ["info@study2india.com"],
    },
    {
      icon: "☎️",
      title: "Call Us",
      text: ["+91 95269 23555"],
    },
    {
      icon: "🕘",
      title: "Business Hours",
      text: ["Monday - Saturday", "9:00 AM - 6:00 PM"],
    },
  ];

  return (
    <section className="min-h-screen bg-gray-50 font-sans">
      <div className="relative overflow-hidden px-4 pt-16 pb-32 text-center text-white">
        

        <h1 className="relative text-3xl font-extrabold md:text-5xl lg:text-5xl text-black">
          Contact Us
        </h1>

        <div className="relative mx-auto mt-5 h-1 w-20 bg-orange-400" />

        <p className="relative mx-auto mt-6 max-w-3xl text-base leading-relaxed md:text-xl">
          We align leaders around a shared purpose and strategic story that
          catalyzes their business and brand to take action.
        </p>
      </div>

      <div className="relative z-10 mx-auto -mt-20 w-[92%] max-w-7xl">
        <div className="grid gap-16 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {items.map((item) => (
            <div
              key={item.title}
              className="relative rounded-lg bg-white px-6 pb-9 pt-16 text-center shadow-2xl"
            >
              <div className="absolute -top-11 left-1/2 grid h-22 w-22 -translate-x-1/2 place-items-center rounded-2xl bg-slate-950 text-4xl text-orange-500 shadow-xl">
                {item.icon}
              </div>

              <h3 className="text-2xl font-bold text-orange-600">
                {item.title}
              </h3>

              <div className="mx-auto my-4 h-1 w-10 bg-orange-500" />

              <p className="text-md leading-relaxed text-slate-800 md:text-md">
                {item.text.map((line) => (
                  <React.Fragment key={line}>
                    {line}
                    <br />
                  </React.Fragment>
                ))}
              </p>
            </div>
          ))}
        </div>

     
      </div>

      <div className="mt-3 flex flex-col items-center justify-between gap-6 bg-slate-950 px-6 py-6 text-center text-white md:flex-row md:px-16 md:text-left">
        <div className="flex flex-col items-center gap-4 md:flex-row">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-white text-2xl">
            ☎
          </span>
          <strong className="text-xl">Ready to start a conversation?</strong>
        </div>

        <p className="text-white/80">
          We're here to help your business grow and make an impact.
        </p>

        <a
        href="https://wa.me/919645838555"
        target="_blank"
        rel="noopener noreferrer"
        className=""
      >
        <button className="rounded-lg bg-[#F68C1E] px-8 py-4 font-bold uppercase tracking-wide text-white transition hover:bg-orange-600">
          Get in Touch
        </button></a>
      </div>
    </section>
  );
}