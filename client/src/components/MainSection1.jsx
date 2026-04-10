
import img1 from '../assets/img1.png'

const MainSection1 = () => {
  return (
    <>
    <section>
    <div className='max-w-7xl mx-auto h-auto py-20 flex flex-col md:flex-row justify-center'>
      <div className='md:w-1/2 p-10 text-center md:text-start'>
        <h2 className='text-3xl sm:text-3xl md:text-5xl font-bold text-center md:text-left mb-10'>Who We Are?</h2>
        <p className='text-md'>
         Study2India is a Kerala-based education consultancy that helps students make confident, well-informed decisions about higher education. Since our inception, we have guided hundreds of students toward genuine, accredited colleges — with full transparency at every step.
        </p>
        <p className='text-md'>We partner only with verified institutions and combine expert counselling with an AI-powered career assessment that identifies each student's aptitude, interests, and personality. The result: guidance that is scientific, personal, and relevant to global opportunities.</p>
     
     <div>
      <button type="button" className="mt-5 px-6 py-3 bg-[#f68c1e] text-white rounded-full hover:bg-black transition duration-300">Learn More</button>

     </div>
      </div>

      <div className='md:w-1/2 flex justify-center p-10'><img src={img1} alt="Image 1" className='rounded-lg w-full h-auto object-cover'/></div>



    </div>
    </section>
    
    </>
  )
}

export default MainSection1