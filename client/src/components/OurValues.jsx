

const OurValues = () => {

  const values = [
    {
      title: "Transparency",
      desc:"Honest information at every stage — from college selection to enrolment."

    },
    {
      title: "Trust",
      desc:"We work only with verified, ethically sound institutions."},
      {
        title: "Guidance",
        desc:"Individualised counselling backed by science and real-time data."
      },
      {
        title: "Support",
        desc:"Continuous assistance for both students and parents throughout the journey."
      },
    
  
  ]


  return (
    <>
       <section className="bg-[#ebaf70] py-20 px-10">
        <div className='max-w-7xl mx-auto h-auto'>
      
            <h2 className='text-3xl sm:text-3xl md:text-5xl font-bold text-center mb-15'>What We Do?</h2>
        
      
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 px-4">
  { values.map((value, index) => (
    <div
      key={index}
      className="bg-white p-6 rounded-lg shadow-md w-full"
    >
      <h3 className="text-xl font-bold mb-2">{value.title}</h3>
      <p className="text-gray-600">{value.desc}</p>
    </div>
  ))}
</div>
    
    
    
        </div>
        </section>
    </>
  )
}

export default OurValues