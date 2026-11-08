import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Sparkles,
  ArrowRight,
  Flame,
  Clock,
  Coins,
  CheckCircle2,
  Heart,
  Search,
  Filter,
  Utensils,
  Leaf,
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsModal } from './components/SettingsModal';
import { UpdatePrompt } from './components/UpdatePrompt';
import { useBackNavigation, useCloseOnBack } from './hooks/useBackNavigation';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { FridgeSelector } from './components/FridgeSelector';
import { RecipeCard } from './components/RecipeCard';
import { RecipeDetailModal } from './components/RecipeDetailModal';
import { WeeklyPlannerView } from './components/WeeklyPlannerView';
import { GroceryListView } from './components/GroceryListView';
import { BackofficeView } from './components/BackofficeView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallButton } from './components/PWAInstallButton';
import { PatronLoginModal } from './components/PatronLoginModal';
import { UserAccountModal } from './components/UserAccountModal';
import { storage } from './services/storage';
import { matchRecipes } from './services/matchingEngine';
import { collectRecipeIds } from './services/menuPlanner';
import { getUsedIngredientIds } from './services/ingredientRoles';
import { Recipe, Ingredient, DayPlan, GroceryItem, IngredientCategory, MealCategory } from './types';
import { subscribeToAuth } from './services/userService';
import { takeInitialRoute, showRecipeAddress } from './services/recipeUrl';
import {
  syncRecipesFromFirestore,
  syncIngredientsFromFirestore,
  seedInitialFirestoreData,
} from './services/firestoreSync';
import {
  CloudStatus,
  ensurePatronCloudSession,
  getPatronToken,
  logoutPatron,
  verifyPatronSession,
} from './services/patronAuth';

type AppTab = 'home' | 'fridge' | 'recipes' | 'weekly' | 'grocery' | 'backoffice';

function MainApp() {
  const { t, getRecipeName } = useLanguage();

  // Address the app was opened with (/recettes or /recette/<slug>), read once before the back-button guard is pushed
  const [initialRoute] = useState(takeInitialRoute);

  // App Navigation & Data State
  const [activeTab, setActiveTabState] = useState<AppTab>(() => (initialRoute ? 'recipes' : 'home'));
  // Previously visited tabs, so the phone's back button returns to them
  const tabHistoryRef = useRef<AppTab[]>([]);
  const activeTabRef = useRef<AppTab>('home');
  activeTabRef.current = activeTab;

  const setActiveTab = useCallback((tab: AppTab) => {
    if (tab === activeTabRef.current) return;
    const history = tabHistoryRef.current;
    if (tab === 'home') history.length = 0;
    else history.push(activeTabRef.current);
    if (history.length > 20) history.shift();
    setActiveTabState(tab);
    window.scrollTo({ top: 0 });
  }, []);

  const [showExitHint, setShowExitHint] = useState(false);
  const exitHintTimer = useRef<number | undefined>(undefined);
  const [recipes, setRecipes] = useState<Recipe[]>(() => storage.getRecipes());
  const [ingredients, setIngredients] = useState<Ingredient[]>(() => storage.getIngredients());
  const [selectedFridgeIds, setSelectedFridgeIds] = useState<string[]>(() => storage.getFridgeSelected());
  // "Placard de base": ingredients considered always available (salt, oil, spices...)
  const [pantryIds, setPantryIds] = useState<string[]>(() => storage.getPreferences().pantryStaples);
  const [favorites, setFavorites] = useState<string[]>(() => storage.getFavorites());
  const [weeklyPlan, setWeeklyPlan] = useState<DayPlan[]>(() => storage.getWeeklyPlan());
  const [groceryList, setGroceryList] = useState<GroceryItem[]>(() => storage.getGroceryList());

  // Modal Detail & Auth State
  const [selectedRecipeDetail, setSelectedRecipeDetail] = useState<Recipe | null>(null);
  const [isPatronModalOpen, setIsPatronModalOpen] = useState(false);
  // Never trusted from storage alone: set only after the server verified the session
  const [isPatronAuthenticated, setIsPatronAuthenticated] = useState(false);
  const [patronCloudStatus, setPatronCloudStatus] = useState<CloudStatus>('local-only');
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [budgetFilter, setBudgetFilter] = useState<number | undefined>(undefined);
  const [timeFilter, setTimeFilter] = useState<number | undefined>(undefined);
  const [cuisineFilter, setCuisineFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<'all' | MealCategory>('all');
  const [healthyFilter, setHealthyFilter] = useState(false);
  const [tierFilter, setTierFilter] = useState<'all' | 'ready' | 'almost' | 'ideas'>('all');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // Secret /patron URL detection & routing (session verified by the server)
  useEffect(() => {
    let cancelled = false;

    const checkPatronRoute = async () => {
      const isPatronPath = window.location.pathname === '/patron' || window.location.hash === '#patron';
      const hasToken = Boolean(getPatronToken());
      if (!isPatronPath && !hasToken) return;

      const valid = hasToken && (await verifyPatronSession());
      if (cancelled) return;

      if (valid) {
        setIsPatronAuthenticated(true);
        if (isPatronPath) setActiveTab('backoffice');
        const cloud = await ensurePatronCloudSession();
        if (!cancelled) setPatronCloudStatus(cloud);
      } else {
        setIsPatronAuthenticated(false);
        if (isPatronPath) setIsPatronModalOpen(true);
      }
    };

    checkPatronRoute();
    const onHashChange = () => {
      checkPatronRoute();
    };
    window.addEventListener('hashchange', onHashChange);
    return () => {
      cancelled = true;
      window.removeEventListener('hashchange', onHashChange);
    };
  }, []);

  // Firebase Auth listener
  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Initial Firestore sync
  useEffect(() => {
    syncRecipesFromFirestore()
      .then((remote) => {
        if (remote && remote.length > 0) {
          setRecipes(remote);
        }
      })
      .catch((err) => {
        console.warn('Initial Firestore sync skipped:', err);
      });
    // Ingredients edited in the backoffice (prices, new items) were never pulled before
    syncIngredientsFromFirestore()
      .then((remote) => {
        if (remote && remote.length > 0) setIngredients(remote);
      })
      .catch(() => {});
  }, []);

  const handlePatronLoginSuccess = (cloud: CloudStatus) => {
    setIsPatronAuthenticated(true);
    setPatronCloudStatus(cloud);
    setActiveTab('backoffice');
    if (window.location.pathname !== '/patron') {
      window.history.replaceState(window.history.state, '', '/patron');
    }
    // Seed initial Firestore collection if needed (only possible with a cloud session)
    if (cloud === 'connected') seedInitialFirestoreData().catch(() => {});
  };

  const handlePatronLogout = () => {
    logoutPatron().catch(() => {});
    setIsPatronAuthenticated(false);
    setPatronCloudStatus('local-only');
    setActiveTab('home');
    if (window.location.pathname === '/patron') {
      window.history.replaceState(window.history.state, '', '/');
    }
  };

  // Opened from /recette/<slug>: show that recipe once the catalog is available
  const deepLinkHandled = useRef(initialRoute?.kind !== 'recipe');
  useEffect(() => {
    if (deepLinkHandled.current || initialRoute?.kind !== 'recipe') return;
    const found = recipes.find((r) => r.slug === initialRoute.slug && r.is_published !== false);
    if (found) {
      deepLinkHandled.current = true;
      setSelectedRecipeDetail(found);
    }
  }, [recipes, initialRoute]);

  // The open recipe has its own address (shareable, indexable); closing it brings back "/"
  const defaultTitle = useRef(document.title);
  useEffect(() => {
    showRecipeAddress(
      selectedRecipeDetail?.slug ?? null,
      selectedRecipeDetail ? `${selectedRecipeDetail.name_fr} | Chnowa Ntayeb by Chef Souhed` : null,
      defaultTitle.current
    );
  }, [selectedRecipeDetail]);

  // Phone back button: close overlays, then go back through tabs, then "press again to exit"
  useCloseOnBack(!!selectedRecipeDetail, () => setSelectedRecipeDetail(null));
  useCloseOnBack(isPatronModalOpen, () => setIsPatronModalOpen(false));
  useCloseOnBack(isUserModalOpen, () => setIsUserModalOpen(false));
  useCloseOnBack(isSettingsOpen, () => setIsSettingsOpen(false));

  useBackNavigation({
    onBack: () => {
      const previous = tabHistoryRef.current.pop();
      if (previous) {
        setActiveTabState(previous);
        return true;
      }
      if (activeTabRef.current !== 'home') {
        setActiveTabState('home');
        return true;
      }
      return false;
    },
    onExitHint: () => {
      setShowExitHint(true);
      window.clearTimeout(exitHintTimer.current);
      exitHintTimer.current = window.setTimeout(() => setShowExitHint(false), 2000);
    },
  });

  const refreshData = () => {
    setRecipes(storage.getRecipes());
    setIngredients(storage.getIngredients());
    setSelectedFridgeIds(storage.getFridgeSelected());
    setWeeklyPlan(storage.getWeeklyPlan());
    setGroceryList(storage.getGroceryList());
  };


  // Synchronize Fridge Selections
  // Functional updates: several quick taps (or scanner additions) must not overwrite each other
  const handleToggleFridgeIngredient = (id: string) => {
    setSelectedFridgeIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      storage.saveFridgeSelected(next);
      return next;
    });
  };

  const handleTogglePantry = (id: string) => {
    setPantryIds((prev) => {
      const next = prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id];
      storage.savePreferences({ pantryStaples: next });
      return next;
    });
  };

  // Ingredients used by at least one published recipe, directly or as a substitute
  const usedIngredientIds = useMemo(() => getUsedIngredientIds(recipes), [recipes]);

  const handleClearFridge = () => {
    setSelectedFridgeIds([]);
    storage.saveFridgeSelected([]);
  };

  const handleAddCustomIngredient = (name: string, category: IngredientCategory) => {
    const created = storage.addCustomIngredient({
      name_fr: name,
      name_derja: name,
      name_ar: name,
      category,
      unit_default: 'pièce',
      default_price_tnd: 2.0,
    });
    setIngredients(storage.getIngredients());
    handleToggleFridgeIngredient(created.id);
  };

  // Toggle Favorite
  const handleToggleFavorite = (recipeId: string) => {
    storage.toggleFavorite(recipeId);
    setFavorites(storage.getFavorites());
  };

  // Generate Grocery List from Missing Recipe Ingredients or Weekly Plan
  const handleGenerateGroceryFromWeek = () => {
    // Starter, main course and dessert of every meal
    const allMealIds = collectRecipeIds(weeklyPlan);
    const itemsMap = new Map<string, { name: string; quantity: number; unit: string; category: IngredientCategory }>();

    allMealIds.forEach((id) => {
      const r = recipes.find((rec) => rec.id === id);
      if (!r) return;
      r.ingredients.forEach((ingItem) => {
        const ing = ingredients.find((i) => i.id === ingItem.ingredient_id);
        const name = ing ? ing.name_fr : ingItem.ingredient_id;
        const current = itemsMap.get(name);
        if (current) {
          current.quantity += ingItem.quantity_base;
        } else {
          itemsMap.set(name, {
            name,
            quantity: ingItem.quantity_base,
            unit: ingItem.unit,
            category: ing ? ing.category : 'other',
          });
        }
      });
    });

    const newGroceryItems: GroceryItem[] = Array.from(itemsMap.values()).map((val, idx) => ({
      id: `grocery_${Date.now()}_${idx}`,
      name: val.name,
      quantity: Math.round(val.quantity * 10) / 10,
      unit: val.unit,
      category: val.category,
      is_checked: false,
    }));

    storage.saveGroceryList(newGroceryItems);
    setGroceryList(newGroceryItems);
    setActiveTab('grocery');
  };

  const handleAddMissingToGrocery = (missingList: { name: string; quantity: number; unit: string }[]) => {
    missingList.forEach((item) => {
      storage.addManualGroceryItem(item.name, item.quantity, item.unit);
    });
    setGroceryList(storage.getGroceryList());
  };

  // Run Deterministic Matching Engine
  const matchingResults = useMemo(
    () =>
      matchRecipes(
        recipes,
        selectedFridgeIds,
        {
          maxBudget: budgetFilter,
          maxTotalTime: timeFilter,
          cuisineType: cuisineFilter,
          category: courseFilter,
          healthyOnly: healthyFilter,
          searchQuery,
        },
        { pantryIds, catalog: ingredients }
      ),
    [recipes, selectedFridgeIds, budgetFilter, timeFilter, cuisineFilter, courseFilter, healthyFilter, searchQuery, pantryIds, ingredients]
  );

  // Filtered by Favorites if requested
  const readyList = showOnlyFavorites
    ? matchingResults.ready.filter((r) => favorites.includes(r.recipe.id))
    : matchingResults.ready;
  const almostList = showOnlyFavorites
    ? matchingResults.almost.filter((r) => favorites.includes(r.recipe.id))
    : matchingResults.almost;
  const ideasList = showOnlyFavorites
    ? matchingResults.ideas.filter((r) => favorites.includes(r.recipe.id))
    : matchingResults.ideas;

  const totalResultsCount = readyList.length + almostList.length + ideasList.length;

  return (
    <div className="min-h-screen flex flex-col bg-surface transition-colors pb-24 md:pb-12 text-ink">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenUserModal={() => setIsUserModalOpen(true)}
        isPatronAuthenticated={isPatronAuthenticated}
        onOpenPatronModal={() => setIsPatronModalOpen(true)}
        onPatronLogout={handlePatronLogout}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6">
        {/* ==================== VIEW 1: HOME ==================== */}
        {activeTab === 'home' && (
          <div className="space-y-10 animate-fade-in">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-hero-from to-hero-to text-white p-6 sm:p-10 shadow-xl">
              <div className="relative z-10 max-w-2xl space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white/90 text-xs font-bold tracking-wide">
                  <span>🇹🇳 Cuisine Tunisienne 100% Gratuite</span>
                  <span>·</span>
                  <span>{recipes.length} Recettes</span>
                  <span>·</span>
                  <span className="text-white">by Chef Souhed</span>
                </div>

                <h1 className="font-display text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                  {t.heroTitle}
                </h1>

                <p className="text-sm sm:text-base text-white/85 leading-relaxed">
                  « {t.slogan} » — {t.heroSubtitle}
                </p>

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => setActiveTab('fridge')}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-accent text-on-accent font-bold text-sm sm:text-base hover:bg-accent-strong shadow-lg shadow-accent/30 active:scale-95 transition"
                  >
                    <span>{t.btnFindMeal}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setActiveTab('recipes')}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm backdrop-blur-xs border border-white/20 transition active:scale-95"
                  >
                    <Utensils className="w-4 h-4 text-amber-300" />
                    <span>Découvrir les recettes</span>
                  </button>

                  <PWAInstallButton variant="secondary" />
                </div>
              </div>

              <div className="pattern-band absolute left-0 right-0 bottom-0 opacity-40! bg-white!" aria-hidden="true" />

              {/* Brand mark as a watermark */}
              <img
                src="/mark.png"
                alt=""
                aria-hidden="true"
                className="absolute -right-6 -bottom-10 w-48 sm:w-64 opacity-20 rotate-12 pointer-events-none select-none"
              />
            </div>

            {/* Quick Metrics & Feature Cards Strip */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
              <button
                onClick={() => {
                  setTimeFilter(15);
                  setActiveTab('recipes');
                }}
                className="p-4 rounded-2xl bg-card border border-line text-left hover:border-brand transition shadow-xs group"
              >
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 w-fit mb-2 group-hover:scale-105 transition-transform">
                  <Flame className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-ink">
                  Plats Express
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">&lt; 15 min de cuisson</p>
              </button>

              <button
                onClick={() => {
                  setBudgetFilter(5);
                  setActiveTab('recipes');
                }}
                className="p-4 rounded-2xl bg-card border border-line text-left hover:border-brand transition shadow-xs group"
              >
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-accent-text w-fit mb-2 group-hover:scale-105 transition-transform">
                  <Coins className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-ink">
                  Moins de 5 DT
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">Économique & étudiant</p>
              </button>

              <button
                onClick={() => {
                  setCuisineFilter('traditionnelle');
                  setActiveTab('recipes');
                }}
                className="p-4 rounded-2xl bg-card border border-line text-left hover:border-brand transition shadow-xs group"
              >
                <div className="p-2 rounded-xl bg-brand/10 text-brand-text w-fit mb-2 group-hover:scale-105 transition-transform">
                  <Utensils className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-ink">
                  Tradition Tounsi
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">Couscous, Rouz, Tajine...</p>
              </button>

              <button
                onClick={() => setActiveTab('weekly')}
                className="p-4 rounded-2xl bg-card border border-line text-left hover:border-brand transition shadow-xs group"
              >
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 w-fit mb-2 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-ink">
                  Menu Semaine
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">Planning anti-gaspillage</p>
              </button>

              <button
                onClick={() => {
                  setHealthyFilter(true);
                  setActiveTab('recipes');
                }}
                className="col-span-2 md:col-span-1 p-4 rounded-2xl bg-card border border-line text-left hover:border-brand transition shadow-xs group"
              >
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 w-fit mb-2 group-hover:scale-105 transition-transform">
                  <Leaf className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-ink">{t.quickHealthyTitle}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{t.quickHealthyDesc}</p>
              </button>
            </div>

            {/* Quick Match Preview: Ready To Cook Right Now */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-ink flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-brand-text" />
                    <span>{t.tierReadyTitle}</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    {matchingResults.ready.length} recettes réalisables immédiatement avec votre frigo
                  </p>
                </div>
                <button
                  onClick={() => {
                    setTierFilter('ready');
                    setActiveTab('recipes');
                  }}
                  className="text-xs font-bold text-brand-text hover:underline"
                >
                  Voir tout ({matchingResults.ready.length})
                </button>
              </div>

              {matchingResults.ready.length === 0 ? (
                <div className="p-6 rounded-2xl bg-card border border-line text-center space-y-3">
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    Cochez quelques ingrédients de base (œufs, tomates, harissa...) pour découvrir vos recettes prêtes à cuisiner !
                  </p>
                  <button
                    onClick={() => setActiveTab('fridge')}
                    className="px-4 py-2 rounded-xl bg-brand text-on-brand text-xs font-bold hover:bg-brand-strong transition shadow-xs"
                  >
                    Remplir mon frigo
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {matchingResults.ready.slice(0, 3).map((res) => (
                    <RecipeCard
                      key={res.recipe.id}
                      result={res}
                      isFavorite={favorites.includes(res.recipe.id)}
                      onToggleFavorite={handleToggleFavorite}
                      onSelectRecipe={(id) => {
                        const found = recipes.find((r) => r.id === id);
                        setSelectedRecipeDetail(found || null);
                      }}
                      allIngredients={ingredients}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== VIEW 2: FRIDGE SELECTOR ==================== */}
        {activeTab === 'fridge' && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-5 rounded-2xl bg-card border border-line shadow-xs">
              <h2 className="text-lg sm:text-xl font-extrabold text-ink">
                {t.fridgeTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {t.fridgeSubtitle}
              </p>
            </div>

            <FridgeSelector
              allIngredients={ingredients}
              selectedIds={selectedFridgeIds}
              pantryIds={pantryIds}
              onTogglePantry={handleTogglePantry}
              usedIngredientIds={usedIngredientIds}
              onToggleIngredient={handleToggleFridgeIngredient}
              onClearAll={handleClearFridge}
              onAddCustomIngredient={handleAddCustomIngredient}
              onSearchRecipes={() => setActiveTab('recipes')}
            />
          </div>
        )}

        {/* ==================== VIEW 3: RECIPES BROWSER & RESULTS ==================== */}
        {activeTab === 'recipes' && (
          <div className="space-y-6 animate-fade-in">
            {/* Filter Bar */}
            <div className="p-4 sm:p-5 rounded-2xl bg-card border border-line shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher par nom de plat (ojja, couscous, kafteji...)"
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
                  />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                      showOnlyFavorites
                        ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
                        : 'bg-card border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${showOnlyFavorites ? 'fill-rose-500' : ''}`} />
                    <span>Favoris ({favorites.length})</span>
                  </button>

                  <select
                    value={budgetFilter || ''}
                    onChange={(e) => setBudgetFilter(e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="px-2.5 py-2 text-xs font-semibold rounded-xl bg-card border border-slate-200 dark:border-slate-700"
                  >
                    <option value="">Budget : Tous</option>
                    <option value="5">&lt; 5 DT</option>
                    <option value="10">&lt; 10 DT</option>
                    <option value="15">&lt; 15 DT</option>
                    <option value="25">&lt; 25 DT</option>
                  </select>

                  <select
                    value={timeFilter || ''}
                    onChange={(e) => setTimeFilter(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="px-2.5 py-2 text-xs font-semibold rounded-xl bg-card border border-slate-200 dark:border-slate-700"
                  >
                    <option value="">Temps : Tous</option>
                    <option value="15">&lt; 15 min</option>
                    <option value="30">&lt; 30 min</option>
                    <option value="45">&lt; 45 min</option>
                  </select>
                </div>
              </div>

              {/* Course (entrée / plat / dessert) and healthy filters */}
              <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-700 overflow-x-auto no-scrollbar">
                {(
                  [
                    ['all', t.courseAll],
                    ['entree', t.courseEntreePlural],
                    ['plat_principal', t.courseMainPlural],
                    ['dessert', t.courseDessertPlural],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setCourseFilter(id)}
                    aria-pressed={courseFilter === id}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                      courseFilter === id
                        ? 'bg-brand text-on-brand shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
                <span className="w-px h-5 bg-line mx-1 shrink-0" aria-hidden="true" />
                <button
                  onClick={() => setHealthyFilter(!healthyFilter)}
                  aria-pressed={healthyFilter}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition border ${
                    healthyFilter
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'bg-card border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300'
                  }`}
                >
                  <Leaf className="w-3.5 h-3.5" />
                  {t.healthyLabel}
                </button>
              </div>

              {/* Tier Filters Switcher */}
              <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-700 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setTierFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                    tierFilter === 'all'
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Tous ({totalResultsCount})
                </button>
                <button
                  onClick={() => setTierFilter('ready')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                    tierFilter === 'ready'
                      ? 'bg-brand text-on-brand shadow-xs'
                      : 'bg-brand/10 text-brand-text'
                  }`}
                >
                  {t.tierReadyTitle} ({readyList.length})
                </button>
                <button
                  onClick={() => setTierFilter('almost')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                    tierFilter === 'almost'
                      ? 'bg-accent text-on-accent shadow-xs'
                      : 'bg-accent/10 text-accent-text'
                  }`}
                >
                  {t.tierAlmostTitle} ({almostList.length})
                </button>
                <button
                  onClick={() => setTierFilter('ideas')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                    tierFilter === 'ideas'
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {t.tierIdeasTitle} ({ideasList.length})
                </button>
              </div>
            </div>

            {/* Results Grid by Tiers */}
            {totalResultsCount === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-card border border-slate-200 dark:border-slate-700 space-y-3">
                <p className="text-base font-bold text-ink">
                  {t.noResultsTitle}
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {t.noResultsDesc}
                </p>
                <button
                  onClick={() => setActiveTab('fridge')}
                  className="px-4 py-2 rounded-xl bg-brand text-on-brand text-xs font-bold"
                >
                  {t.btnOpenFridge}
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Tier 1: Ready to Cook */}
                {(tierFilter === 'all' || tierFilter === 'ready') && readyList.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-brand" />
                      <h3 className="font-extrabold text-sm sm:text-base text-ink">
                        {t.tierReadyTitle} ({readyList.length})
                      </h3>
                      <span className="text-xs text-slate-400">· {t.tierReadyDesc}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {readyList.map((res) => (
                        <RecipeCard
                          key={res.recipe.id}
                          result={res}
                          isFavorite={favorites.includes(res.recipe.id)}
                          onToggleFavorite={handleToggleFavorite}
                          onSelectRecipe={(id) => {
                            const found = recipes.find((r) => r.id === id);
                            setSelectedRecipeDetail(found || null);
                          }}
                          allIngredients={ingredients}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Tier 2: Almost Ready */}
                {(tierFilter === 'all' || tierFilter === 'almost') && almostList.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-accent" />
                      <h3 className="font-extrabold text-sm sm:text-base text-ink">
                        {t.tierAlmostTitle} ({almostList.length})
                      </h3>
                      <span className="text-xs text-slate-400">· {t.tierAlmostDesc}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {almostList.map((res) => (
                        <RecipeCard
                          key={res.recipe.id}
                          result={res}
                          isFavorite={favorites.includes(res.recipe.id)}
                          onToggleFavorite={handleToggleFavorite}
                          onSelectRecipe={(id) => {
                            const found = recipes.find((r) => r.id === id);
                            setSelectedRecipeDetail(found || null);
                          }}
                          allIngredients={ingredients}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Tier 3: Ideas */}
                {(tierFilter === 'all' || tierFilter === 'ideas') && ideasList.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                      <h3 className="font-extrabold text-sm sm:text-base text-ink">
                        {t.tierIdeasTitle} ({ideasList.length})
                      </h3>
                      <span className="text-xs text-slate-400">· {t.tierIdeasDesc}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {ideasList.map((res) => (
                        <RecipeCard
                          key={res.recipe.id}
                          result={res}
                          isFavorite={favorites.includes(res.recipe.id)}
                          onToggleFavorite={handleToggleFavorite}
                          onSelectRecipe={(id) => {
                            const found = recipes.find((r) => r.id === id);
                            setSelectedRecipeDetail(found || null);
                          }}
                          allIngredients={ingredients}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================== VIEW 4: WEEKLY PLAN ==================== */}
        {activeTab === 'weekly' && (
          <WeeklyPlannerView
            plan={weeklyPlan}
            recipes={recipes}
            allIngredients={ingredients}
            onUpdatePlan={(updated) => {
              setWeeklyPlan(updated);
              storage.saveWeeklyPlan(updated);
            }}
            onGenerateGroceryList={handleGenerateGroceryFromWeek}
            onSelectRecipeDetail={(id) => {
              const found = recipes.find((r) => r.id === id);
              setSelectedRecipeDetail(found || null);
            }}
          />
        )}

        {/* ==================== VIEW 5: GROCERY LIST ==================== */}
        {activeTab === 'grocery' && (
          <GroceryListView
            items={groceryList}
            onToggleItem={(id) => {
              storage.toggleGroceryItem(id);
              setGroceryList(storage.getGroceryList());
            }}
            onAddItem={(name, qty, unit) => {
              storage.addManualGroceryItem(name, qty, unit);
              setGroceryList(storage.getGroceryList());
            }}
            onClearChecked={() => {
              storage.clearCheckedGroceryItems();
              setGroceryList(storage.getGroceryList());
            }}
          />
        )}

        {/* ==================== VIEW 6: BACKOFFICE ==================== */}
        {activeTab === 'backoffice' && isPatronAuthenticated && (
          <BackofficeView
            cloudStatus={patronCloudStatus}
            recipes={recipes}
            ingredients={ingredients}
            onRefreshData={refreshData}
            onLogout={handlePatronLogout}
          />
        )}
      </main>

      {/* Footer (every public page): brand signature */}
      {activeTab !== 'backoffice' && (
        <footer className="max-w-7xl w-full mx-auto px-4 sm:px-6 mt-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-6 border-t border-line text-xs text-ink-muted">
            <div className="flex items-center gap-2.5">
              <img src="/mark.png" alt="" width={75} height={32} className="h-8 w-auto" />
              <div className="leading-tight">
                <p className="font-display font-extrabold text-sm text-ink">Chnowa Ntayeb?</p>
                <p>Elli 3andek fel frigo, na3mlou bih makla !</p>
              </div>
            </div>
            <p>
              <span className="font-semibold text-accent-text">by Chef Souhed</span> · © {new Date().getFullYear()} Chnowa Ntayeb
            </p>
          </div>
        </footer>
      )}

      {/* Recipe Detail Modal */}
      <RecipeDetailModal
        recipe={selectedRecipeDetail}
        isOpen={!!selectedRecipeDetail}
        onClose={() => setSelectedRecipeDetail(null)}
        isFavorite={selectedRecipeDetail ? favorites.includes(selectedRecipeDetail.id) : false}
        onToggleFavorite={handleToggleFavorite}
        allIngredients={ingredients}
        selectedFridgeIds={selectedFridgeIds}
        pantryIds={pantryIds}
        onAddMissingToGrocery={handleAddMissingToGrocery}
      />

      {/* Secret Patron Super-User Login Modal */}
      <PatronLoginModal
        isOpen={isPatronModalOpen}
        onClose={() => {
          setIsPatronModalOpen(false);
          if (activeTab === 'backoffice' && !isPatronAuthenticated) {
            setActiveTab('home');
          }
        }}
        onSuccess={handlePatronLoginSuccess}
      />

      {/* User Account & Cloud Sync Modal */}
      <UserAccountModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        currentUser={currentUser}
        onOpenPatronLogin={() => setIsPatronModalOpen(true)}
      />

      {/* Theme / mode / language settings */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* "Press back again to exit" hint */}
      {showExitHint && (
        <div
          role="status"
          className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-ink text-surface text-xs font-semibold shadow-lg animate-fade-in"
        >
          {t.backAgainToExit}
        </div>
      )}

      {/* New app version available (service worker update) */}
      <UpdatePrompt />

      {/* Offline Connectivity Toast */}
      <OfflineIndicator />

      {/* Ergonomic Mobile Bottom Tab Navigation */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        fridgeCount={selectedFridgeIds.length}
      />
    </div>
  );
}


export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <MainApp />
      </ThemeProvider>
    </LanguageProvider>
  );
}
