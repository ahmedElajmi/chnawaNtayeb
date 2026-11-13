import type { ComponentType, ReactNode } from 'react';
import {
  Carrot,
  Database,
  LayoutDashboard,
  Palette,
  SlidersHorizontal,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';
import { ENGINE_PAGES, PATRON_PAGES, patronPath, type PatronPage } from '@/shared/paths';
import type { BackofficeTexts } from '../i18n/backofficeTexts';
import {
  EngineBoostsPage,
  EngineHistoryPage,
  EnginePublishBar,
  EngineScenariosPage,
  EngineSimulatorPage,
  EngineSubstitutionsPage,
  EngineTuningPage,
} from '../matching/EnginePages';
import { MatchingDraftProvider } from '../matching/MatchingDraftContext';
import { AppearancePage, DataPage, HomePage, IngredientsPage, RecipesPage } from './pages';
import { RecipeReviewPage } from '../review/RecipeReviewPage';

/** What the navigation knows to show a number next to an entry (counted on the whole lists). */
export interface SectionCounts {
  recipes: number;
  ingredients: number;
}

export interface BackofficeSubPage {
  page: string;
  label: (b: BackofficeTexts) => string;
  element: ReactNode;
}

export interface BackofficeSection {
  page: PatronPage;
  icon: LucideIcon;
  label: (b: BackofficeTexts) => string;
  hint: (b: BackofficeTexts) => string;
  /** Number shown next to the entry; null = none */
  count?: (counts: SectionCounts) => number | null;
  /** Page content (a section without sub-pages) */
  element?: ReactNode;
  /** More addresses under this page (e.g. ':id' for one item), each with its own content */
  routes?: { path: string; element: ReactNode }[];
  /** Sub-pages, each with its own address; the first one opens by default */
  subPages?: BackofficeSubPage[];
  /** Shared state and header of the sub-pages (e.g. the engine draft and its publication bar) */
  frame?: ComponentType<{ children: ReactNode }>;
}

function EngineFrame({ children }: { children: ReactNode }) {
  return (
    <MatchingDraftProvider>
      <div className="space-y-4">
        <EnginePublishBar />
        {children}
      </div>
    </MatchingDraftProvider>
  );
}

/**
 * Every page of the backoffice, in menu order. Adding a page = one entry here (+ its slug in
 * PATRON_PAGES and its labels in backofficeTexts): menu, mobile menu, address and title follow.
 */
export const BACKOFFICE_SECTIONS: readonly BackofficeSection[] = [
  {
    page: PATRON_PAGES.home,
    icon: LayoutDashboard,
    label: (b) => b.home,
    hint: (b) => b.homeHint,
    element: <HomePage />,
  },
  {
    page: PATRON_PAGES.recipes,
    icon: UtensilsCrossed,
    label: (b) => b.recipes,
    hint: (b) => b.recipesHint,
    count: (c) => c.recipes,
    element: <RecipesPage />,
    routes: [{ path: ':id', element: <RecipeReviewPage /> }],
  },
  {
    page: PATRON_PAGES.ingredients,
    icon: Carrot,
    label: (b) => b.ingredients,
    hint: (b) => b.ingredientsHint,
    count: (c) => c.ingredients,
    element: <IngredientsPage />,
  },
  {
    page: PATRON_PAGES.engine,
    icon: SlidersHorizontal,
    label: (b) => b.engine,
    hint: (b) => b.engineHint,
    frame: EngineFrame,
    subPages: [
      { page: ENGINE_PAGES.simulator, label: (b) => b.engineSimulator, element: <EngineSimulatorPage /> },
      { page: ENGINE_PAGES.scenarios, label: (b) => b.engineScenarios, element: <EngineScenariosPage /> },
      { page: ENGINE_PAGES.boosts, label: (b) => b.engineBoosts, element: <EngineBoostsPage /> },
      { page: ENGINE_PAGES.substitutions, label: (b) => b.engineSubstitutions, element: <EngineSubstitutionsPage /> },
      { page: ENGINE_PAGES.tuning, label: (b) => b.engineTuning, element: <EngineTuningPage /> },
      { page: ENGINE_PAGES.history, label: (b) => b.engineHistory, element: <EngineHistoryPage /> },
    ],
  },
  {
    page: PATRON_PAGES.appearance,
    icon: Palette,
    label: (b) => b.appearance,
    hint: (b) => b.appearanceHint,
    element: <AppearancePage />,
  },
  {
    page: PATRON_PAGES.data,
    icon: Database,
    label: (b) => b.data,
    hint: (b) => b.dataHint,
    element: <DataPage />,
  },
];

/** The section an address belongs to (the home page only for /patron itself). */
export function sectionOf(pathname: string): BackofficeSection {
  const path = pathname.replace(/\/+$/, '');
  return (
    BACKOFFICE_SECTIONS.find((s) => {
      if (s.page === PATRON_PAGES.home) return false;
      const base = patronPath(s.page);
      return path === base || path.startsWith(`${base}/`);
    }) ?? BACKOFFICE_SECTIONS[0]
  );
}
