import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MobileApp } from './mobile/MobileApp';
import { ThemeProvider } from './lib/theme';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <MobileApp />
    </ThemeProvider>
  </StrictMode>
);
