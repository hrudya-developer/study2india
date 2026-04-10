import React from 'react'

const HeroContent = () => {
  return (
    <div className='flex flex-col mt-15'>
        <h1 className='font-bold text-5xl text-white mb-6 text-center mt-20'><span className='text-[#f68c1e] text-6xl'>S</span>tudy<span className='text-[#f68c1e] text-6xl'>2</span>India</h1>
   <h1 className='font-bold text-2xl text-white mb-6 text-center'>Empowering Students. Enabling Futures.</h1>
   <h2 className='font-bold text-lg text-white mb-6 text-center'>Your Gateway to South India's Trusted Colleges</h2>

<div className='flex justify-center gap-6'>
   <button className='bg-[#f68c1e] text-white px-6 py-2 rounded-full cursor-pointer'>Get Started</button>
   <button className='bg-transparent border-2 border-white text-white px-6 py-2 rounded-full cursor-pointer'> Courses</button>
   </div>
   
    </div>
  )
}

export default HeroContent