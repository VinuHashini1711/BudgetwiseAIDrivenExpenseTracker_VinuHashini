import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('bw_theme');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    localStorage.setItem('bw_theme', JSON.stringify(isDarkMode));
    
    // Apply theme to document
    if (isDarkMode) {
      document.documentElement.style.colorScheme = 'dark';
      document.body.style.background = '#0f172a';
      document.body.style.color = '#f1f5f9';
    } else {
      document.documentElement.style.colorScheme = 'light';
      document.body.style.background = '#f8fafb';
      document.body.style.color = '#111827';
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
