import type { ComponentType } from 'react';
import { ArrowRight, CheckCircle2, Coins, Flame, Leaf, Sparkles, Utensils } from 'lucide-react';
import { Link } from 'react-router';
import { useLanguage } from '@/app/providers/LanguageContext';
import { PWAInstallButton } from '@/shared/ui/PWAInstallButton';
import { useCatalog } from '@/app/ContainerContext';
import { PATHS } from '@/shared/paths';
import { DEFAULT_RECIPE_FILTERS } from '@/features/recipes/recipeFilters';
import { useRecipesHref } from '@/features/recipes/filterMemory';
import { useRecipeMatches } from '@/features/recipes/hooks';
import { RecipeGrid } from '@/features/recipes/RecipeGrid';

interface Shortcut {
  to: string;
  icon: ComponentType<{ className?: string }>;
  iconClass: string;
  title: string;
  desc: string;
  wide?: boolean;
}

export function HomePage() {
  const { t } = useLanguage();
  const { recipes } = useCatalog();
  const { ready } = useRecipeMatches(DEFAULT_RECIPE_FILTERS);
  const recipesWith = useRecipesHref();

  const shortcuts: Shortcut[] = [
    {
      to: recipesWith({ maxTime: 15 }),
      icon: Flame,
      iconClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600',
      title: 'Plats Express',
      desc: '< 15 min de cuisson',
    },
    {
      to: recipesWith({ maxBudget: 5 }),
      icon: Coins,
      iconClass: 'bg-rose-50 dark:bg-rose-950/40 text-accent-text',
      title: 'Moins de 5 DT',
      desc: 'Économique & étudiant',
    },
    {
      to: recipesWith({ cuisine: 'traditionnelle' }),
      icon: Utensils,
      iconClass: 'bg-brand/10 text-brand-text',
      title: 'Tradition Tounsi',
      desc: 'Couscous, Rouz, Tajine...',
    },
    {
      to: PATHS.planner,
      icon: Sparkles,
      iconClass: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600',
      title: 'Menu Semaine',
      desc: 'Planning anti-gaspillage',
    },
    {
      to: recipesWith({ healthyOnly: true }),
      icon: Leaf,
      iconClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600',
      title: t.quickHealthyTitle,
      desc: t.quickHealthyDesc,
      wide: true,
    },
  ];

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-hero-from to-hero-to text-white p-6 sm:p-10 shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white/90 text-xs font-bold tracking-wide">
            <span>🇹🇳 Cuisine Tunisienne 100% Gratuite</span>
            <span>·</span>
            <span>{recipes.length} Recettes</span>
            <span>·</span>
            <span className="text-white">by Chef Souhed</span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl font-black tracking-tight leading-tight">{t.heroTitle}</h1>

          <p className="text-sm sm:text-base text-white/85 leading-relaxed">
            « {t.slogan} » — {t.heroSubtitle}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to={PATHS.fridge}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-accent text-on-accent font-bold text-sm sm:text-base hover:bg-accent-strong shadow-lg shadow-accent/30 active:scale-95 transition"
            >
              <span>{t.btnFindMeal}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to={recipesWith()}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm backdrop-blur-xs border border-white/20 transition active:scale-95"
            >
              <Utensils className="w-4 h-4 text-amber-300" />
              <span>Découvrir les recettes</span>
            </Link>

            <PWAInstallButton variant="secondary" />
          </div>
        </div>

        <div className="pattern-band absolute left-0 right-0 bottom-0 opacity-40! bg-white!" aria-hidden="true" />
        <img
          src="/mark.png"
          alt=""
          aria-hidden="true"
          className="absolute -right-6 -bottom-10 w-48 sm:w-64 opacity-20 rotate-12 pointer-events-none select-none"
        />
      </div>

      {/* Shortcuts */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
        {shortcuts.map(({ to, icon: Icon, iconClass, title, desc, wide }) => (
          <Link
            key={title}
            to={to}
            className={`${wide ? 'col-span-2 md:col-span-1 ' : ''}p-4 rounded-2xl bg-card border border-line text-left hover:border-brand transition shadow-xs group`}
          >
            <div className={`p-2 rounded-xl ${iconClass} w-fit mb-2 group-hover:scale-105 transition-transform`}>
              <Icon className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-ink">{title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
          </Link>
        ))}
      </div>

      {/* Ready to cook right now */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-brand-text" />
              <span>{t.tierReadyTitle}</span>
            </h2>
            <p className="text-xs text-slate-500">{ready.length} recettes réalisables immédiatement avec votre frigo</p>
          </div>
          <Link to={recipesWith({ tier: 'ready' })} className="text-xs font-bold text-brand-text hover:underline">
            Voir tout ({ready.length})
          </Link>
        </div>

        {ready.length === 0 ? (
          <div className="p-6 rounded-2xl bg-card border border-line text-center space-y-3">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Cochez quelques ingrédients de base (œufs, tomates, harissa...) pour découvrir vos recettes prêtes à
              cuisiner !
            </p>
            <Link
              to={PATHS.fridge}
              className="inline-block px-4 py-2 rounded-xl bg-brand text-on-brand text-xs font-bold hover:bg-brand-strong transition shadow-xs"
            >
              Remplir mon frigo
            </Link>
          </div>
        ) : (
          <RecipeGrid results={ready.slice(0, 3)} />
        )}
      </section>
    </div>
  );
}
