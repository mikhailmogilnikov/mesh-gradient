import Link from 'next/link';
import { PiGithubLogoFill } from 'react-icons/pi';

import { LandingMesh } from '@/src/features/mesh';
import { CONFIG } from '@/src/shared/model/config';

export default function Home() {
  return (
    <div className='w-screen h-svh bg-black flex items-center justify-center relative overflow-hidden'>
      <LandingMesh />

      <div className='z-1 flex flex-col items-center justify-center gap-5'>
        <h1 className='text-white text-4xl sm:text-5xl font-bold z-1 text-shadow-lg'>Mesh Gradient</h1>
        <p className='text-white/70 text-center text-base max-w-md px-4 text-balance font-medium'>
          JavaScript library for creating animated mesh gradients in the browser.
        </p>
        <div className='flex items-center justify-center gap-3'>
          <Link
            href='/docs'
            className=' bg-white/10 backdrop-blur-xl text-white font-medium px-4 h-12 flex items-center justify-center rounded-full shadow-xl hover:bg-white/20 transition-all duration-300 hover:shadow-lg active:scale-95'
          >
            Get Started
          </Link>
          <Link
            href={CONFIG.github}
            target='_blank'
            className='bg-zinc-900/50 h-12 w-12 flex items-center justify-center rounded-full shadow-xl hover:bg-zinc-800 transition-all duration-300 hover:shadow-lg active:scale-95 backdrop-blur-xl'
          >
            <PiGithubLogoFill className='size-7 text-white' />
          </Link>
        </div>
      </div>
    </div>
  );
}
