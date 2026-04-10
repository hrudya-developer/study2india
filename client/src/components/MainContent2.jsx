

const MainContent2 = () => {

  const steps = [
    {
      title: "Career Assessment",
      desc:"AI-powered test identifies aptitude, interests, and personality traits."

    },
    {
      title: "Personal Counselling",
      desc:"Expert advisor matches the right course and college to the student."},
      {
        title: "College Verification",
        desc:"Every recommended institution is checked for affiliation and accreditation."
      },
      {
        title: "Admission Support",
        desc:"Document preparation, deadlines, and registration — handled end to end."
      },
      {
        title: "Post-Admission Care",
        desc:"Guidance continues until the student joins their programme."
    },
        {
        title: "Explore More",
        desc:"Explore courses and build your future career path."
    }
  ]


  return (
    <>
       <section className="bg-[#f3f3f3] py-20 px-10">
        <div className='max-w-7xl mx-auto h-auto'>
      
            <h2 className='text-3xl sm:text-3xl md:text-5xl font-bold text-center mb-10'>What We Do?</h2>
            <p className="text-center pb-10">
              Our process is straightforward and built around the student:
            </p>
      
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 px-4">
  {steps.map((step, index) => (
    <div
      key={index}
      className="bg-white p-6 rounded-lg shadow-md w-full border-x-3 border-[#f68c1e]"
    >
      <h3 className="text-xl font-bold mb-2">{step.title}</h3>
      <p className="text-gray-600">{step.desc}</p>
    </div>
  ))}
</div>
    
    
    
        </div>
        </section>
    </>
  )
}

export default MainContent2