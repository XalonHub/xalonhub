'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useUI } from '../services/uiContext';
import Link from 'next/link';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { serviceMode, setServiceMode } = useUI();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  const handleModeChange = (mode) => {
    setServiceMode(mode);
    
    // Smart Redirection Logic
    if (pathname.includes('/partner')) {
      // If on partner page, go to home to show the catalog
      router.push('/');
    } else if (pathname === '/services') {
      // If on services page, check if we're in a specific partner view
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('partnerId')) {
        // Clear partner specificity and return to general catalog for that category/mode
        urlParams.delete('partnerId');
        urlParams.delete('partnerName');
        router.push(`/services?${urlParams.toString()}`);
      }
    }
  };

  const LOGO_URL = "/admin/assets/logo_full.svg"; // Fallback to relative if host mismatch
  const BACKEND_LOGO = "http://localhost:5001/admin/assets/logo_full.svg";

  return (
    <header className={`premium-header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="header-glass-container">
        {/* Left: Branding */}
        <div className="brand-section" onClick={() => router.push('/')}>
          <img src={BACKEND_LOGO} alt="XalonHub" className="premium-logo" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = LOGO_URL; }} />
        </div>

        {/* Center/Left: Linear Nav Group */}
        <div className="nav-group-wrapper">
          <nav className="linear-nav">
            <div 
              className={`nav-item ${serviceMode === 'at-home' ? 'active' : ''}`} 
              onClick={() => handleModeChange('at-home')}
            >
              Freelancers
            </div>
            <div 
              className={`nav-item ${serviceMode === 'at-salon' ? 'active' : ''}`} 
              onClick={() => handleModeChange('at-salon')}
            >
              Salons
            </div>
            <Link href="/partner" prefetch={false} className={`nav-item action-link ${pathname === '/partner' ? 'active' : ''}`}>
              Partner
            </Link>
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="discovery-actions">
          <button className="btn-app-premium" onClick={() => router.push('/#download')}>
             Get App
          </button>
        </div>
      </div>
    </header>
  );
}
