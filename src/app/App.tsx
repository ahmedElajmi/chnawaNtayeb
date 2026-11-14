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
    // Shared data follows the database live: a change made on another device shows at once
    const stopCatalog = container.catalog.start();
    const stopSettings = container.matchingSettings.start();
    const stopRecipeCategories = container.categories.recipe.start();
    const stopIngredientCategories = container.categories.ingredient.start();
    container.superAdmin.restoreSession();
    return () => {
      stopCatalog();
      stopSettings();
      stopRecipeCategories();
      stopIngredientCategories();
    };
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
