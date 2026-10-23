import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'motion/react';
import App from './App.tsx';
import { Toaster } from '@/components/ui/toast';
import { TooltipProvider } from '@/components/ui/tooltip';
import '@/styles/index.css';

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
  <MotionConfig reducedMotion="user">
    <TooltipProvider>
      <Toaster timeout={2000}>
        <App />
      </Toaster>
    </TooltipProvider>
  </MotionConfig>
  // </StrictMode>
);
