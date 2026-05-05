import Link from 'next/link';
import { PiGithubLogoFill } from 'react-icons/pi';

import { LandingMesh } from '@/components/landing-mesh';

const GITHUB_URL = 'https://github.com/mikhailmogilnikov/mesh-gradient';

export default function HomePage() {
  return (
    <div className='relative flex h-svh w-screen items-center justify-center overflow-hidden bg-black'>
      <LandingMesh />

      <div className='z-1 flex flex-col items-center justify-center gap-5'>
        <h1 className='text-shadow-lg z-1 text-4xl font-bold text-white sm:text-5xl'>Mesh Gradient</h1>
        <p className='max-w-md px-4 text-center text-base text-balance font-medium text-white/70'>
          JavaScript library for creating animated mesh gradients in the browser.
        </p>
        <div className='flex items-center justify-center gap-3'>
          <Link
            href='/docs'
            className='flex h-12 items-center justify-center rounded-full bg-white/10 px-4 font-medium text-white shadow-xl backdrop-blur-xl transition-all duration-300 hover:bg-white/20 hover:shadow-lg active:scale-95'
          >
            Get Started
          </Link>
          <Link
            href={GITHUB_URL}
            target='_blank'
            className='flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900/50 shadow-xl backdrop-blur-xl transition-all duration-300 hover:bg-zinc-800 hover:shadow-lg active:scale-95'
          >
            <PiGithubLogoFill className='size-7 text-white' />
          </Link>
        </div>
      </div>
    </div>
  );
}
