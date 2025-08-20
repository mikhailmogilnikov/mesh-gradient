import Link from 'next/link';

import { LandingMesh } from '@/src/features/mesh/ui/landing-mesh';

export default function Home() {
  return (
    <div className='w-screen h-svh bg-black flex items-center justify-center relative overflow-hidden'>
      <LandingMesh />

      <div className='z-1 flex flex-col items-center justify-center gap-5'>
        <h1 className='text-white text-4xl sm:text-5xl font-bold z-1 text-shadow-lg'>Mesh Gradient</h1>
        <div className='flex items-center justify-center gap-3'>
          <Link
            href='/docs'
            className=' bg-white/10 backdrop-blur-xl text-white font-medium px-4 py-2 rounded-full shadow-xl hover:bg-white/20 transition-all duration-300 hover:shadow-lg active:scale-95'
          >
            Documetation
          </Link>
        </div>
      </div>
    </div>
  );
}
