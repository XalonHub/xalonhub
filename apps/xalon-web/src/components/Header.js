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
          <img src={BACKEND_LOGO} alt="XalonHub" className="premium-logo" onError={(e) => { e.target.src = LOGO_URL; }} />
        </div>

        {/* Center: Segmented Toggle (Minimalist) */}
        <div className="segmented-control-wrapper">
          <div className={`segmented-control ${serviceMode}`}>
            <div 
              className="control-item at-home" 
              onClick={() => handleModeChange('at-home')}
            >
               Home View
            </div>
            <div 
              className="control-item at-salon" 
              onClick={() => handleModeChange('at-salon')}
            >
              Salon View
            </div>
            <div className={`active-slider ${serviceMode === 'at-home' ? 'left' : 'right'}`} />
          </div>
        </div>

        {/* Right: Premium Nav Cluster */}
        <div className="discovery-actions">
          <Link href="/partner" prefetch={false} className={`action-link ${pathname === '/partner' ? 'active' : ''}`}>
            Partner with Xalon
          </Link>
          <button className="btn-app-premium" onClick={() => router.push('/#download')}>
             Get App
          </button>
        </div>
      </div>
    </header>
  );
}
