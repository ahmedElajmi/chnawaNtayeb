// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import type { UserPreferences } from '@/core/preferences';
import type { Language } from '@/core/shared';
import { PriceRange } from './PriceRange';
import { Shelf } from './Shelf';
import { CategoryRail } from './CategoryRail';
import { MatchingBadge, MatchReason } from '../../recipes/components/MatchingBadge';
import { LanguageProvider } from '@/app/providers/LanguageContext';

const prefs: UserPreferences = {
  language: 'fr',
  default_servings: 4,
  mode: 'light',
  themeId: '',
  pantryStaples: [],
  dietary_filter: 'all',
};

vi.mock('@/app/ContainerContext', () => ({
  useContainer: () => ({
    preferences: { load: () => prefs, save: (p: Partial<UserPreferences>) => Object.assign(prefs, p) },
  }),
}));

function renderWithLanguage(ui: React.ReactElement, language: Language = 'fr'): { root: Root; container: HTMLElement } {
  prefs.language = language;
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(<LanguageProvider>{ui}</LanguageProvider>));
  return { root, container };
}

beforeEach(() => {
  prefs.language = 'fr';
  document.body.innerHTML = '';
});

describe('PriceRange (shared price display)', () => {
  it('renders through formatPriceRange with the language currency', () => {
    const { container, root } = renderWithLanguage(<PriceRange range={{ min: 2.5, max: 4 }} />);
    expect(container.textContent).toContain('2.5');
    expect(container.textContent).toContain('DT');
    act(() => root.unmount());
  });
});

describe('MatchingBadge / MatchReason (core codes → interface texts)', () => {
  it('badge: one wording per level, never a "ready now" guarantee', () => {
    const { container, root } = renderWithLanguage(<MatchingBadge level="all-present" />);
    expect(container.textContent).toContain('Tous les ingrédients semblent présents — quantités à vérifier');
    expect(container.textContent).not.toContain('Prête');
    act(() => root.unmount());
  });

  it('badge: the other levels use the missing wording', () => {
    const { container, root } = renderWithLanguage(<MatchingBadge level="almost" />);
    expect(container.textContent).toContain('Presque prête');
    act(() => root.unmount());
  });

  it('reasons render the core codes with the ingredient names', () => {
    const { container, root } = renderWithLanguage(
      <MatchReason
        reasons={[
          { code: 'missing-key', ingredientIds: ['k1'] },
          { code: 'missing-secondary', ingredientIds: ['s1', 's2'] },
          { code: 'missing-cost', ingredientIds: [], cost: { min: 3, max: 7 } },
        ]}
        nameOf={(id) => ({ k1: 'Harissa', s1: 'Oignon', s2: 'Ail' })[id] ?? ''}
      />
    );
    expect(container.textContent).toContain('Ingrédient clé manquant : Harissa');
    expect(container.textContent).toContain('À acheter : Oignon, Ail');
    expect(container.textContent).toContain('Coût des manquants : 3 – 7 DT');
    act(() => root.unmount());
  });

  it('arabic families join names with the Arabic comma', () => {
    const { container, root } = renderWithLanguage(
      <MatchReason
        reasons={[{ code: 'missing-secondary', ingredientIds: ['s1', 's2'] }]}
        nameOf={(id) => ({ s1: 'بصل', s2: 'ثوم' })[id] ?? ''}
      />,
      'ar'
    );
    expect(container.textContent).toContain('بصل، ثوم');
    act(() => root.unmount());
  });

  it('renders nothing without reasons', () => {
    const { container, root } = renderWithLanguage(<MatchReason reasons={[]} nameOf={() => ''} />);
    expect(container.firstElementChild).toBeNull();
    act(() => root.unmount());
  });
});

describe('Shelf (editorial stall)', () => {
  it('renders title, optional see-all link and content', () => {
    const { container, root } = renderWithLanguage(
      <Shelf title="Catégories" action={{ href: '/recipes', label: 'Tout voir' }}>
        <div>content</div>
      </Shelf>
    );
    expect(container.querySelector('h2')?.textContent).toBe('Catégories');
    const a = container.querySelector('a');
    expect(a?.getAttribute('href')).toBe('/recipes');
    expect(a?.className).toContain('min-h-[44px]');
    expect(container.textContent).toContain('content');
    act(() => root.unmount());
  });

  it('no link without action; no hardcoded palette', () => {
    const { container, root } = renderWithLanguage(
      <Shelf title="x">
        <div>c</div>
      </Shelf>
    );
    expect(container.querySelector('a')).toBeNull();
    expect(container.firstElementChild?.className).not.toMatch(/slate-|gray-/);
    act(() => root.unmount());
  });
});

describe('CategoryRail (category tiles on the shared Rail)', () => {
  const items = [
    { id: 'c1', label: 'Poisson', href: '/recipes?category=poisson', imageUrl: undefined },
    { id: 'c2', label: 'Pates', href: '/recipes?category=pates', imageUrl: 'https://example.com/p.jpg' },
  ];

  it('renders one real link per tile, with a tint-initial fallback without photo', () => {
    const { container, root } = renderWithLanguage(<CategoryRail label="Catégories" items={items} />);
    const links = [...container.querySelectorAll('a')];
    expect(links).toHaveLength(2);
    expect(links[0].getAttribute('href')).toBe('/recipes?category=poisson');
    expect(links[0].textContent).toContain('Poisson');
    expect(container.querySelector('img')).not.toBeNull();
    expect(container.querySelector('.bg-tint')?.textContent).toBe('P'); // tint initial without photo
    act(() => root.unmount());
  });
});
