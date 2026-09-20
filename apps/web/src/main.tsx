import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { Toaster } from '@/components/ui/toast';
import { TooltipProvider } from '@/components/ui/tooltip';
import '@/styles/index.css';
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TooltipProvider>
      <Toaster timeout={2000}>
        <App />
      </Toaster>
    </TooltipProvider>
  </StrictMode>
);
