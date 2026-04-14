'use client';

import { useState, useEffect } from 'react';

export default function PaytmSandbox({ amount, onPaymentComplete, onCancel }) {
  const [status, setStatus] = useState('processing'); // 'processing', 'success', 'failed'

  useEffect(() => {
    // Mock processing delay
    const timer = setTimeout(() => {
        setStatus('success');
        setTimeout(() => {
            onPaymentComplete(true);
        }, 1500);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{
      ...styles.container,
      background: status === 'success' ? '#0f172a' : '#f8f9fa' // Paytm dark blue/light
    }}>
      <div style={styles.header}>
         <button onClick={onCancel} style={styles.cancelBtn} disabled={status === 'success'}>Cancel</button>
         <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: status === 'success' ? '#fff' : '#002970' }}>Paytm Sandbox</span>
         <span style={{ width: '50px' }}></span>
      </div>

      <div style={styles.content}>
         {status === 'processing' && (
           <>
              <div style={styles.spinner}></div>
              <h3 style={{ color: '#002970', marginTop: '2rem' }}>Processing Payment...</h3>
              <p style={{ color: '#64748b' }}>Please do not press back or refresh the page.</p>
              <div style={styles.amountBox}>
                 <span style={{ fontSize: '1rem', color: '#64748b' }}>Amount Payable</span>
                 <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#002970' }}>₹{amount}</span>
              </div>
           </>
         )}

         {status === 'success' && (
           <>
             <div style={styles.successCheck}>✓</div>
             <h3 style={{ color: '#fff', marginTop: '2rem' }}>Payment Successful</h3>
             <p style={{ color: '#94a3b8' }}>Redirecting you back...</p>
           </>
         )}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes scaleIn {
          0% { transform: scale(0); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

const styles = {
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.5rem',
        borderBottom: '1px solid rgba(0,0,0,0.1)'
    },
    cancelBtn: {
        background: 'none',
        border: 'none',
        color: '#ef4444',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: 'bold',
        width: '50px'
    },
    content: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center'
    },
    spinner: {
        width: '60px',
        height: '60px',
        border: '4px solid #e2e8f0',
        borderTop: '4px solid #00baf2', // Paytm blue
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
    },
    successCheck: {
        width: '80px',
        height: '80px',
        background: '#00baf2',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '3rem',
        animation: 'scaleIn 0.3s ease-out'
    },
    amountBox: {
        background: 'white',
        padding: '1.5rem 3rem',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        marginTop: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
    }
};
