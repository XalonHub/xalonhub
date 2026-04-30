'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Header() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'bg-white/95 backdrop-blur-xl py-4 shadow-subtle' : 'bg-transparent py-10'}`}>
      <div className="container flex items-center justify-between">
        {/* Branding */}
        <div 
          className="cursor-pointer group"
          onClick={() => router.push('/')}
        >
          <span className={`font-serif text-3xl font-bold tracking-tighter transition-colors ${isScrolled ? 'text-[#1A1A1A]' : 'text-white'}`}>
            XALONHUB<span className="text-[#C5A059]">.</span>
          </span>
        </div>

        {/* Minimalist Navigation - Clean Heroic Look */}
        <nav className="hidden md:flex items-center gap-16">
        </nav>

        {/* Primary CTA */}
        <div>
          <button 
            onClick={() => router.push('/#download')}
            className={`px-10 py-4 rounded-xl text-[11px] font-bold uppercase tracking-[0.25em] transition-all shadow-premium ${
              isScrolled 
                ? 'bg-[#1A1A1A] text-white hover:bg-[#C5A059]' 
                : 'bg-white/10 text-white backdrop-blur-md border border-white/20 hover:bg-[#C5A059]'
            }`}
          >
            Get App
          </button>
        </div>
      </div>
    </header>
  );
}
