'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const UIContext = createContext();

export function UIProvider({ children }) {
  const [serviceMode, setServiceMode] = useState('at-home'); // 'at-home' or 'at-salon'

  // Load initial mode from localStorage if available
  useEffect(() => {
    const savedMode = localStorage.getItem('xalon_service_mode');
    if (savedMode) setServiceMode(savedMode);
  }, []);

  const updateServiceMode = (mode) => {
    setServiceMode(mode);
    localStorage.setItem('xalon_service_mode', mode);
  };

  return (
    <UIContext.Provider value={{ serviceMode, setServiceMode: updateServiceMode }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}
