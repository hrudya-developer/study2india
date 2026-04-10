import logo from '../assets/logo.png'

const Footer = () => {
  return (
    <section className='footer w-full bg-black'>
        <div className='max-w-7xl mx-auto h-auto py-10 px-4 text-center text-white'>

<div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-10 border-b border-white pb-10'>
<div className='mb-5 flex flex-col justify-center items-center'>
    <div className='text-2xl font-bold mb-2'><img src={logo} alt="Study2India Logo" className='bg-white p-2 rounded-lg'/></div>
    <p className='text-sm text-start'>Together, let's guide the next generation toward informed choices, brighter careers, and a stronger future.</p>

</div>
<div className='mb-5 text-start flex flex-col justify-center items-center'>
    <h3 className='text-xl mb-2'>Quick Links</h3>
    <ul className='text-start text-sm'>
        <li><a href='#' className='text-white hover:text-gray-300'>Home</a></li>
        <li><a href='#' className='text-white hover:text-gray-300'>About Us</a></li>
        <li><a href='#' className='text-white hover:text-gray-300'>Services</a></li>
        <li><a href='#' className='text-white hover:text-gray-300'>Contact</a></li>
    </ul>
</div>
<div className='mb-5 text-start flex flex-col justify-center items-center'>
    <h3 className='text-xl mb-2'>Contact Us</h3>
    <p className='text-sm'>Email:info@study2india.com   </p>
    <p className='text-sm'>Website: www.study2india.com   </p>
    <p className='text-sm'>Phone: +91 95269 23555   </p>
</div>



            </div>


            <div className='text-sm grid grid-cols-1 sm:grid-cols-1 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-4 mt-5'>
                <p>Thodupuzha <br />(Head Office):<br /> +91 95269 23555</p>
                <p>Thiruvalla: <br />+91 96458 38555</p>
                <p>Kottayam: <br />+91 97458 28555</p>
                <p>Thrissur:<br />+91 99471 74555</p>
                <p>Kattapana:<br />+91 70258 48586</p>
                <p>Kochi:<br />+91 95269 89555</p>
                <p>Kollam:<br />+91 99475 89555</p>
                <p>Kannur:<br />+91 99471 74555</p>

            </div>

             <div className="grid grid-cols-1 text-center mt-10 text-sm">
                <p>© 2026 Study2India. All Rights Reserved</p>
                
            </div>
            
            
            </div>
           
    
    </section>
  )
}

export default Footer