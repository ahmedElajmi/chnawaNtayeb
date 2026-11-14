import type { ComponentType, ReactNode } from 'react';
import {
  Carrot,
  ClipboardCheck,
  Database,
  FolderTree,
  GitBranch,
  LayoutDashboard,
  Palette,
  SlidersHorizontal,
  Users,
  UserRound,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';
import {
  CATEGORY_PAGES,
  CLIENTS_PAGES,
  ENGINE_PAGES,
  SUPER_ADMIN_PAGES,
  superAdminPath,
  WORKFLOW_PAGES,
  type SuperAdminPage,
} from '@/shared/paths';
import { IngredientCategoriesPage, RecipeCategoriesPage } from '../categories/CategoriesPage';
import { ClientsPage } from '../users/ClientsPage';
import { CountriesPage } from '../users/CountriesPage';
import { QueuePage } from '../review/QueuePage';
import {
  ReviewSettingsDraftProvider,
  RolesEditorPage,
  TeamPage,
  WorkflowSaveBar,
  WorkflowStepsPage,
} from '../workflows/WorkflowPages';
import type { Permission } from '@/core/review';
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
import { IngredientReviewRoute, RecipeReviewRoute } from '../review/ReviewPage';

/** What the navigation knows to show a number next to an entry (counted on the whole lists). */
export interface SectionCounts {
  recipes: number;
  ingredients: number;
  /** Cells waiting for the reviewer */
  pending: number;
}

export interface BackofficeSubPage {
  page: string;
  label: (b: BackofficeTexts) => string;
  element: ReactNode;
}

export interface BackofficeSection {
  page: SuperAdminPage;
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
  /** Right needed to see the page (the database rules check it again) */
  requires?: Permission;
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

function WorkflowsFrame({ children }: { children: ReactNode }) {
  return (
    <ReviewSettingsDraftProvider>
      <div className="space-y-4">
        <WorkflowSaveBar />
        {children}
      </div>
    </ReviewSettingsDraftProvider>
  );
}

/**
 * Every page of the backoffice, in menu order. Adding a page = one entry here (+ its slug in
 * SUPER_ADMIN_PAGES and its labels in backofficeTexts): menu, mobile menu, address and title follow.
 */
export const BACKOFFICE_SECTIONS: readonly BackofficeSection[] = [
  {
    page: SUPER_ADMIN_PAGES.home,
    icon: LayoutDashboard,
    label: (b) => b.home,
    hint: (b) => b.homeHint,
    element: <HomePage />,
  },
  {
    page: SUPER_ADMIN_PAGES.review,
    icon: ClipboardCheck,
    label: (b) => b.queueTitle,
    hint: (b) => b.queueHint,
    count: (c) => c.pending || null,
    element: <QueuePage />,
  },
  {
    page: SUPER_ADMIN_PAGES.recipes,
    icon: UtensilsCrossed,
    label: (b) => b.recipes,
    hint: (b) => b.recipesHint,
    count: (c) => c.recipes,
    element: <RecipesPage />,
    routes: [{ path: ':id', element: <RecipeReviewRoute /> }],
  },
  {
    page: SUPER_ADMIN_PAGES.ingredients,
    icon: Carrot,
    label: (b) => b.ingredients,
    hint: (b) => b.ingredientsHint,
    count: (c) => c.ingredients,
    element: <IngredientsPage />,
    routes: [{ path: ':id', element: <IngredientReviewRoute /> }],
  },
  {
    page: SUPER_ADMIN_PAGES.categories,
    icon: FolderTree,
    label: (b) => b.categories,
    hint: (b) => b.categoriesHint,
    requires: 'publish',
    subPages: [
      { page: CATEGORY_PAGES.recipes, label: (b) => b.catRecipesTab, element: <RecipeCategoriesPage /> },
      { page: CATEGORY_PAGES.ingredients, label: (b) => b.catIngredientsTab, element: <IngredientCategoriesPage /> },
    ],
  },
  {
    page: SUPER_ADMIN_PAGES.engine,
    icon: SlidersHorizontal,
    label: (b) => b.engine,
    hint: (b) => b.engineHint,
    requires: 'publish',
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
    page: SUPER_ADMIN_PAGES.appearance,
    icon: Palette,
    label: (b) => b.appearance,
    hint: (b) => b.appearanceHint,
    requires: 'publish',
    element: <AppearancePage />,
  },
  {
    page: SUPER_ADMIN_PAGES.team,
    icon: UserRound,
    label: (b) => b.teamTitle,
    hint: (b) => b.teamHint,
    requires: 'manage_roles',
    element: <TeamPage />,
  },
  {
    page: SUPER_ADMIN_PAGES.clients,
    icon: Users,
    label: (b) => b.clientsTitle,
    hint: (b) => b.clientsHint,
    requires: 'manage_roles',
    frame: WorkflowsFrame,
    subPages: [
      { page: CLIENTS_PAGES.directory, label: (b) => b.clientsTitle, element: <ClientsPage /> },
      { page: CLIENTS_PAGES.countries, label: (b) => b.countriesTitle, element: <CountriesPage /> },
    ],
  },
  {
    page: SUPER_ADMIN_PAGES.workflows,
    icon: GitBranch,
    label: (b) => b.workflowsTitle,
    hint: (b) => b.workflowsHint,
    requires: 'manage_workflows',
    frame: WorkflowsFrame,
    subPages: [
      { page: WORKFLOW_PAGES.steps, label: (b) => b.workflowsSteps, element: <WorkflowStepsPage /> },
      { page: WORKFLOW_PAGES.roles, label: (b) => b.workflowsRoles, element: <RolesEditorPage /> },
    ],
  },
  {
    page: SUPER_ADMIN_PAGES.data,
    icon: Database,
    label: (b) => b.data,
    hint: (b) => b.dataHint,
    requires: 'publish',
    element: <DataPage />,
  },
];

/** The section an address belongs to (the home page only for /admin itself). */
export function sectionOf(pathname: string): BackofficeSection {
  const path = pathname.replace(/\/+$/, '');
  return (
    BACKOFFICE_SECTIONS.find((s) => {
      if (s.page === SUPER_ADMIN_PAGES.home) return false;
      const base = superAdminPath(s.page);
      return path === base || path.startsWith(`${base}/`);
    }) ?? BACKOFFICE_SECTIONS[0]
  );
}
