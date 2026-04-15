'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Footer() {
  const router = useRouter();
  
  const LOGO_URL = "/admin/assets/logo_full.svg";
  const BACKEND_LOGO = "http://localhost:5001/admin/assets/logo_full.svg";

  return (
    <footer className="footer-premium">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-about">
            <div className="logo" onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>
              <img src={BACKEND_LOGO} alt="XalonHub" className="footer-logo" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = LOGO_URL; }} />
            </div>
            <p>Bringing premium salon expertise to your doorstep while changing the lives of service professionals.</p>
          </div>
          <div className="footer-links">
            <h4>Quick Links</h4>
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              <li style={{ marginBottom: '0.5rem' }}>
                <Link href="/about" style={{ textDecoration: 'none', color: 'inherit' }}>About Us</Link>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <Link href="/services" style={{ textDecoration: 'none', color: 'inherit' }}>Services</Link>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <Link href="/privacy" style={{ textDecoration: 'none', color: 'inherit' }}>Privacy Policy</Link>
              </li>
            </ul>
          </div>
          <div className="footer-contact" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <h4>Contact Us</h4>
            <a href="mailto:hello@xalonhub.com" style={{ textDecoration: 'none', color: 'inherit' }}>hello@xalonhub.com</a>
            <a href="tel:+918960046001" style={{ textDecoration: 'none', color: 'inherit' }}>+91 89 6004 6001</a>
          </div>
          <div className="footer-app">
            <h4>Download App</h4>
            <div className="store-buttons-footer">
              <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="App Store" style={{ height: '40px', cursor: 'pointer' }} />
              <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Play Store" style={{ height: '40px', cursor: 'pointer' }} />
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Xalonhub Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
