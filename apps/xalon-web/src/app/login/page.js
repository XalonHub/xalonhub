'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { sendOtp, verifyOtp } from '../../services/api';
import '../globals.css';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: Phone, 2: OTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setLoading(true);
    try {
      await sendOtp(phone);
      setStep(2);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await verifyOtp(phone, otp);
      localStorage.setItem('xalon_token', data.token);
      localStorage.setItem('xalon_user', JSON.stringify(data.user));
      router.push('/');
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <button onClick={() => router.back()} className="back-btn">←</button>
          <h2>{step === 1 ? 'Login / Signup' : 'Verify Mobile'}</h2>
        </div>
        
        <p className="login-desc">
          {step === 1 
            ? 'Enter your mobile number to continue' 
            : `We've sent a 4-digit code to +91 ${phone}`}
        </p>

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={step === 1 ? handleSendOtp : handleVerifyOtp}>
          {step === 1 ? (
            <div className="input-group">
              <span className="prefix">+91</span>
              <input
                type="tel"
                placeholder="Enter Mobile Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                autoFocus
              />
            </div>
          ) : (
            <div className="otp-group">
              <input
                type="tel"
                placeholder="Enter 4-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                autoFocus
              />
            </div>
          )}

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? 'Processing...' : step === 1 ? 'Send OTP' : 'Verify & Continue'}
          </button>
        </form>

        {step === 2 && (
          <button className="resend-link" onClick={handleSendOtp}>
            Resend OTP
          </button>
        )}

        <div className="login-footer">
          <p>By continuing, you agree to our Terms & Conditions</p>
        </div>
      </div>
    </div>
  );
}
