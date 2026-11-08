import { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router';
import { LanguageProvider } from '@/app/providers/LanguageContext';
import { ThemeProvider } from '@/app/providers/ThemeContext';
import { createContainer } from '@/app/container';
import { ContainerProvider } from '@/app/ContainerContext';
import { AppRoutes } from '@/app/AppRoutes';

export default function App() {
  const [container] = useState(createContainer);

  useEffect(() => {
    container.catalog.syncFromRemote();
    container.patron.restoreSession();
    container.matchingSettings.load();
  }, [container]);

  return (
    <ContainerProvider container={container}>
      <LanguageProvider>
        <ThemeProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ThemeProvider>
      </LanguageProvider>
    </ContainerProvider>
  );
}
