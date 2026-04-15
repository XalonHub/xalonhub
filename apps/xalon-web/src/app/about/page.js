'use client';

import '../globals.css';
import Footer from '../../components/Footer';

export default function AboutPage() {
  return (
    <main className="info-page" style={{ backgroundColor: '#fafafa', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="container" style={{ padding: '6rem 1rem 4rem', flex: 1, maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '3.5rem', marginBottom: '2rem', color: 'var(--primary)', textAlign: 'center', fontWeight: '800' }}>About Xalonhub Inc</h1>
        <div style={{ background: 'white', padding: '3rem', borderRadius: '24px', boxShadow: 'var(--shadow)', lineHeight: '1.8', fontSize: '1.1rem', color: 'var(--text-dark)' }}>
          <p style={{ marginBottom: '1.5rem' }}>
            At <strong>Xalonhub Inc</strong>, we believe that self-care should be accessible, seamless, and entirely tailored to you. Born out of the desire to bridge the gap between beauty enthusiasts and top-tier professionals, our platform is redefining how you discover and book salons, spas, and independent experts.
          </p>
          <h2 style={{ fontSize: '2rem', marginTop: '2.5rem', marginBottom: '1rem', color: '#1f2937', fontWeight: '700' }}>Our Mission</h2>
          <p style={{ marginBottom: '1.5rem' }}>
            Our mission is simple: to bring premium salon expertise to your doorstep while empowering service professionals to build their brands, manage their client base, and thrive independently. Whether you're looking for a quick haircut at a neighborhood salon or a luxurious spa day brought directly to your home, Xalonhub Inc is your ultimate trusted partner.
          </p>
          <h2 style={{ fontSize: '2rem', marginTop: '2.5rem', marginBottom: '1rem', color: '#1f2937', fontWeight: '700' }}>Quality & Trust</h2>
          <p style={{ marginBottom: '1.5rem' }}>
            We hand-pick and verify every partner on our platform. By cultivating a curated network of elite salons and freelance artists, we ensure that every session booked through Xalonhub Inc adheres to the highest standards of hygiene, punctuality, and artistic excellence. 
          </p>
          <p style={{ marginTop: '2rem', fontSize: '1.2rem', fontWeight: '500', color: 'var(--primary)', textAlign: 'center' }}>
            Experience beauty on your terms, with Xalonhub Inc.
          </p>
        </div>
      </div>
      <Footer />
    </main>
  );
}
