'use client';

import '../globals.css';
import Footer from '../../components/Footer';

export default function PrivacyPolicyPage() {
  return (
    <main className="info-page" style={{ backgroundColor: '#fafafa', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="container" style={{ padding: '6rem 1rem 4rem', flex: 1, maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '3.5rem', marginBottom: '2rem', color: 'var(--primary)', textAlign: 'center', fontWeight: '800' }}>Privacy Policy</h1>
        <div style={{ background: 'white', padding: '3rem', borderRadius: '24px', boxShadow: 'var(--shadow)', lineHeight: '1.8', fontSize: '1.1rem', color: 'var(--text-dark)' }}>
          <p style={{ marginBottom: '1.5rem' }}>
            <strong>Effective Date:</strong> January 1, 2026
          </p>
          <p style={{ marginBottom: '1.5rem' }}>
            At <strong>Xalonhub Inc</strong>, we value your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and share information about you when you interact with our website, mobile application, and related services (collectively, the "Platform").
          </p>
          
          <h2 style={{ fontSize: '1.8rem', marginTop: '2.5rem', marginBottom: '1rem', color: '#1f2937', fontWeight: '700' }}>1. Information We Collect</h2>
          <p style={{ marginBottom: '1rem' }}>We may collect the following types of information:</p>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '1.5rem' }}>
            <li style={{ marginBottom: '0.5rem' }}><strong>Personal Information:</strong> Name, email address, phone number, and account credentials.</li>
            <li style={{ marginBottom: '0.5rem' }}><strong>Booking Information:</strong> Service history, selected salons, freelancers, appointment times, and preferred locations.</li>
            <li style={{ marginBottom: '0.5rem' }}><strong>Device Information:</strong> IP address, device type, browser information, and app usage data.</li>
          </ul>

          <h2 style={{ fontSize: '1.8rem', marginTop: '2.5rem', marginBottom: '1rem', color: '#1f2937', fontWeight: '700' }}>2. How We Use Your Information</h2>
          <p style={{ marginBottom: '1rem' }}>Your information is primarily used to:</p>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '1.5rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>Facilitate your bookings and connect you with local artists and salons.</li>
            <li style={{ marginBottom: '0.5rem' }}>Improve the functionality and premium experience of the Xalonhub Inc platform.</li>
            <li style={{ marginBottom: '0.5rem' }}>Send necessary transactional emails and support communications.</li>
          </ul>

          <h2 style={{ fontSize: '1.8rem', marginTop: '2.5rem', marginBottom: '1rem', color: '#1f2937', fontWeight: '700' }}>3. Information Sharing</h2>
          <p style={{ marginBottom: '1.5rem' }}>
            We only share your necessary appointment details (such as your name and the booked service) with the specific service provider you have chosen. We do not sell your personal data to third parties.
          </p>

          <h2 style={{ fontSize: '1.8rem', marginTop: '2.5rem', marginBottom: '1rem', color: '#1f2937', fontWeight: '700' }}>4. Your Rights</h2>
          <p style={{ marginBottom: '1.5rem' }}>
            You have the right to access, correct, or delete your personal data stored on our platform. To exercise these rights, or if you have any questions regarding this Privacy Policy, please contact us at <a href="mailto:hello@xalonhub.com" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}>hello@xalonhub.com</a>.
          </p>
        </div>
      </div>
      <Footer />
    </main>
  );
}
