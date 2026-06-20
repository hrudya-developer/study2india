import Navbar from "../components/Navbar"



const Courses = () => {
    const colleges = [
        {
            name:"JSS Mysuru"
        },
        {
            name:"St. John's"
        },
        {
            name:"MS Ramaiah"
        },
        {
            name:"Vydehi"
        },
        {
            name:"BGS Global"
        },
        {
            name:"MVJ"
        },
        {
            name:"Sapthagiri"
        },
        {
            name:"Rajarajeshwari"
        },
        {
            name:"Kempegowda"
        },
        {
            name:"Oxford"
        },
        {
            name:"Sreedevi"
        },
        {
            name:"Siddhartha"
        },
        {
            name:"Sri Ramachandra"
        },
        {
            name:"Saveetha"
        },
        {
            name:"SRM"
        },
        {
            name:"Vinayaka Missions"
        },
        {
            name:"Chettinad"
        },
        {
            name:"Apollo"
        },
        {
            name:"Sree Balaji"
        },
{
    name:"VELS"
},
{
    name:"KIMS "
},
{name:"Amritha"},
{
    name:"Malla Reddy"
}
    ]



  return (
    <section className="bg-gray-100">
     
        <div className='max-w-7xl mx-auto h-auto py-20 px-10'>
            <h1 className='text-3xl sm:text-3xl md:text-5xl font-bold text-center mb-15'>Courses</h1>
            <h4 className='text-2xl font-semibold pb-5 text-center'>
                Medicine, Dentistry & Veterinary Science
            </h4>
            <p>Healthcare and life sciences offer some of the most respected careers in the world. Through verified partnerships with recognised universities, Study2India guides students into high-quality programmes — with honest guidance and complete transparency throughout.</p>

<p>We place particular focus on Dentistry (BDS) and Veterinary Science (B.V.Sc.), where strong career prospects and growing demand make them outstanding choices for the right student.</p>

            
            <h4 className='text-2xl font-semibold py-8 text-center'>Undergraduate Programmes</h4>
            <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-10'>
                <div className='bg-[#f3f3f3] border-x-3 border-[#f68c1e] rounded-lg p-5'>
                <p className='font-bold'>MBBS</p>
                <p>Bachelor of Medicine & Bachelor of Surgery</p>
            </div>
             <div className='bg-[#f3f3f3] border-x-3 border-[#f68c1e] rounded-lg p-5'>
                <p className='font-bold'>BDS</p>
                <p>Bachelor of Dental Surgery</p>
            </div>
             <div className='bg-[#f3f3f3] border-x-3 border-[#f68c1e] rounded-lg p-5'>
                <p className='font-bold'>B.V.Sc. & A.H. </p>
                <p>Bachelor of Veterinary Science and Animal Husbandry</p>
            </div>
</div>
<p className='text-center pt-5 font-semibold'>We also guide students into AYUSH programmes — BAMS, BHMS, BUMS, and BNYS — for those interested in traditional and holistic medicine systems.</p>


  <h4 className='text-2xl font-semibold py-8 text-center'>Postgraduate Programmes</h4>
  <p className='text-center'>MD, MS, MDS, and MVSc — for professionals seeking specialisation in modern medicine, surgery, dentistry, and veterinary science.</p>


<h4 className='text-2xl font-semibold py-8 text-center'>Our Partner Colleges</h4>
  <p className='text-center'>Study2India works with verified, accredited institutions across Tamil Nadu, Karnataka, Telangana, and Andhra Pradesh — including some of the most prestigious medical colleges in South India.</p>


<div>
    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 py-10'>

{colleges.map((college,index)=>(
    <div key={index} className='bg-[#f3f3f3] rounded-lg p-5'>
        <p className='font-bold'>{college.name}</p>
    </div>
))}
        </div>
</div>




</div>



    </section>
  )
}

export default Courses
