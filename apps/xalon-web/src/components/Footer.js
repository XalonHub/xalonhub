'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer-premium">
      <div className="container">
        <div className="footer-grid">
          {/* About Column */}
          <div className="footer-about col-span-1 md:col-span-2">
            <span className="font-serif text-3xl font-bold tracking-tighter text-[#2C2C2C]">
              XALONHUB<span className="text-[#8B9D83]">.</span>
            </span>
            <p className="text-[#8A8A8A] font-light text-base mt-4 max-w-sm leading-relaxed">
              Redefining luxury beauty and wellness through seamless technology. Experience world-class services at your convenience, exclusively on our mobile app.
            </p>
            <div className="mt-6 space-y-2">
              <div className="flex items-center gap-4 text-[#2C2C2C] text-sm font-medium">
                 <span className="text-[#8B9D83] font-bold">E:</span> hello@xalonhub.com
              </div>
              <div className="flex items-center gap-4 text-[#2C2C2C] text-sm font-medium">
                 <span className="text-[#8B9D83] font-bold">P:</span> +91 89 6004 6001
              </div>
            </div>
          </div>

          {/* Platform Column */}
          <div className="footer-links">
            <h4 className="text-[11px] font-bold text-[#2C2C2C]/40 uppercase tracking-[0.3em] mb-6">Platform</h4>
            <ul className="space-y-3">
              <li><Link href="/" className="text-sm font-medium text-[#8A8A8A] hover:text-[#8B9D83] transition-colors">Salons</Link></li>
              <li><Link href="/partner" className="text-sm font-medium text-[#8A8A8A] hover:text-[#8B9D83] transition-colors">Become a Partner</Link></li>
            </ul>
          </div>

          {/* Support Column */}
          <div className="footer-links">
            <h4 className="text-[11px] font-bold text-[#2C2C2C]/40 uppercase tracking-[0.3em] mb-6">Support</h4>
            <ul className="space-y-3">
              <li><Link href="/about" className="text-sm font-medium text-[#8A8A8A] hover:text-[#8B9D83] transition-colors">Our Story</Link></li>
              <li><Link href="/privacy" className="text-sm font-medium text-[#8A8A8A] hover:text-[#8B9D83] transition-colors">Privacy Policy</Link></li>
              <li><Link href="/admin" className="text-sm font-medium text-[#8A8A8A] hover:text-[#8B9D83] transition-colors">Admin Portal</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#2C2C2C]/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[11px] font-bold text-[#2C2C2C]/30 uppercase tracking-[0.2em]">
            © 2026 XalonHub Inc. All rights reserved.
          </p>
          <div className="flex gap-10">
            <span className="text-[11px] font-bold text-[#2C2C2C]/60 uppercase tracking-widest cursor-pointer hover:text-[#8B9D83] transition-colors">Instagram</span>
            <span className="text-[11px] font-bold text-[#2C2C2C]/60 uppercase tracking-widest cursor-pointer hover:text-[#8B9D83] transition-colors">LinkedIn</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
