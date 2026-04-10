import hero1 from '../assets/hero1.png';
import HeroContent from './HeroContent';
import Navbar from './Navbar';

const Hero = () => {
  return (
    <section className='hero w-full h-screen bg-cover bg-center py-20' style={{ backgroundImage: `url(${hero1})` }}>
        <Navbar/>
         <HeroContent />

    </section>
  )
}

export default Hero