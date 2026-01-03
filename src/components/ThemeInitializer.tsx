import { useEffect } from 'react';

const APPEARANCE_STORAGE_KEY = 'gctv-appearance';

interface AppearanceSettings {
  theme: 'dark' | 'light' | 'system';
  accentColor: string;
}

const defaultAppearance: AppearanceSettings = {
  theme: 'dark',
  accentColor: '#E91E8C',
};

// Apply theme to document
const applyTheme = (theme: 'dark' | 'light' | 'system') => {
  const root = document.documentElement;
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('light', !prefersDark);
  } else {
    root.classList.toggle('light', theme === 'light');
  }
};

// Apply accent color
const applyAccentColor = (hexColor: string) => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  const hue = Math.round(h * 360);
  const saturation = Math.round(s * 100);
  const lightness = Math.round(l * 100);

  document.documentElement.style.setProperty('--primary', `${hue} ${saturation}% ${lightness}%`);
  document.documentElement.style.setProperty('--primary-glow', `${hue} ${saturation}% ${Math.min(lightness + 10, 100)}%`);
  document.documentElement.style.setProperty('--ring', `${hue} ${saturation}% ${lightness}%`);
};

export const ThemeInitializer = () => {
  useEffect(() => {
    try {
      const stored = localStorage.getItem(APPEARANCE_STORAGE_KEY);
      const settings: AppearanceSettings = stored ? JSON.parse(stored) : defaultAppearance;
      applyTheme(settings.theme);
      applyAccentColor(settings.accentColor);
    } catch (e) {
      // Fallback to dark theme if localStorage fails
      applyTheme('dark');
    }

    // Listen for system theme changes if using system theme
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const stored = localStorage.getItem(APPEARANCE_STORAGE_KEY);
      const settings: AppearanceSettings = stored ? JSON.parse(stored) : defaultAppearance;
      if (settings.theme === 'system') {
        applyTheme('system');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return null;
};
