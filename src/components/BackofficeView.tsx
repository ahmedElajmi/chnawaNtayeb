import React, { useState } from 'react';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Carrot,
  Database,
  Plus,
  Pencil,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  Check,
  Search,
  Eye,
  EyeOff,
  Coins,
  Clock,
  ChefHat,
  X,
  Cloud,
  RefreshCw,
  LogOut,
  ShieldCheck,
  AlertTriangle,
  CloudOff,
  Palette,
} from 'lucide-react';
import { Recipe, Ingredient, IngredientCategory, MealCategory, CuisineType, Difficulty } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { storage } from '../services/storage';
import {
  saveRecipeToFirestore,
  deleteRecipeFromFirestore,
  syncRecipesFromFirestore,
  syncIngredientsFromFirestore,
  saveIngredientToFirestore,
  pushAllToFirestore,
  initializeCloudCatalog,
  CloudWriteResult,
} from '../services/firestoreSync';
import { initialRecipes } from '../data/initialRecipes';
import firebaseConfig from '../../firebase-applet-config.json';
import { slugify } from '../services/textNormalize';
import { CloudStatus } from '../services/patronAuth';
import { ThemeEditor } from './ThemeEditor';
import { RecipeIngredientsEditor } from './RecipeIngredientsEditor';
import { getUsedIngredientIds } from '../services/ingredientRoles';
import { normalizeCategory } from '../services/mealCourse';
import { RecipeBadges } from './RecipeBadges';
import { normalizeYouTubeUrl, parseYouTubeId, youTubeThumbnail } from '../services/youtube';
import { useCloseOnBack } from '../hooks/useBackNavigation';

interface BackofficeViewProps {
  cloudStatus: CloudStatus;
  recipes: Recipe[];
  ingredients: Ingredient[];
  onRefreshData: () => void;
  onLogout?: () => void;
}


export const BackofficeView: React.FC<BackofficeViewProps> = ({
  cloudStatus,
  recipes,
  ingredients,
  onRefreshData,
  onLogout,
}) => {
  const { t, getRecipeName, getIngredientName } = useLanguage();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'recipes' | 'ingredients' | 'themes' | 'data'>('dashboard');
  const [recipeSearch, setRecipeSearch] = useState('');
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [toast, setToast] = useState<{ message: string; isError: boolean } | null>(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);

  // Edit / Add Recipe Modal State
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  useCloseOnBack(isRecipeModalOpen, () => setIsRecipeModalOpen(false));

  // Ingredient quick price editing state
  const [priceEdits, setPriceEdits] = useState<Record<string, number>>({});

  // New ingredient form state
  const [newIngNameFr, setNewIngNameFr] = useState('');
  const [newIngNameDerja, setNewIngNameDerja] = useState('');
  const [newIngNameAr, setNewIngNameAr] = useState('');
  const [newIngCategory, setNewIngCategory] = useState<IngredientCategory>('vegetables');
  const [newIngUnit, setNewIngUnit] = useState('kg');
  const [newIngPrice, setNewIngPrice] = useState(2.0);

  const showToast = (message: string, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), isError ? 6000 : 3500);
  };

  /** Shows the success message, or the cloud error when Firestore refused / was unreachable. */
  const reportCloud = (result: CloudWriteResult, successMsg: string) => {
    if (result.ok) showToast(successMsg);
    else showToast(result.error, true);
  };

  // KPIs
  const usedIds = getUsedIngredientIds(recipes);
  const unusedIngredients = ingredients.filter((i) => !usedIds.has(i.id));
  const totalCount = recipes.length;
  const publishedCount = recipes.filter((r) => r.is_published).length;
  const avgCost = totalCount > 0 ? (recipes.reduce((acc, r) => acc + r.estimated_cost_tnd, 0) / totalCount).toFixed(1) : '0';
  const avgTime = totalCount > 0 ? Math.round(recipes.reduce((acc, r) => acc + r.prep_time_minutes + r.cook_time_minutes, 0) / totalCount) : 0;

  // Recipe CRUD with Firestore sync
  const handleTogglePublish = async (recipe: Recipe) => {
    const updated = { ...recipe, is_published: !recipe.is_published };
    const result = await saveRecipeToFirestore(updated);
    onRefreshData();
    reportCloud(result, `Recette "${recipe.name_fr}" ${updated.is_published ? 'publiée' : 'passée en brouillon'}`);
  };

  const handleDeleteRecipe = async (id: string, name: string) => {
    if (window.confirm(`Confirmer la suppression de "${name}" ?`)) {
      const result = await deleteRecipeFromFirestore(id);
      onRefreshData();
      reportCloud(result, 'Recette supprimée');
    }
  };

  const handleOpenAddRecipe = () => {
    setEditingRecipe({
      id: `custom_rec_${Date.now()}`,
      slug: `recette-${Date.now()}`,
      name_fr: '',
      name_derja: '',
      name_ar: '',
      description_fr: '',
      description_derja: '',
      description_ar: '',
      image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      prep_time_minutes: 15,
      cook_time_minutes: 20,
      base_servings: 4,
      estimated_cost_tnd: 10.0,
      category: 'plat_principal',
      is_healthy: false,
      cuisine_type: 'familiale',
      difficulty: 'facile',
      ingredients: [
        { ingredient_id: 'ing_tomate', quantity_base: 2, unit: 'pièces', role: 'key' },
        { ingredient_id: 'ing_oignon', quantity_base: 1, unit: 'pièce', role: 'secondary' },
        { ingredient_id: 'ing_huile_olive', quantity_base: 3, unit: 'c.à.s', role: 'staple' },
      ],
      steps: [
        {
          step_number: 1,
          instruction_fr: 'Préparer les ingrédients et faire revenir à feu doux.',
          instruction_derja: '7adhir el khadhra w 9alli 3la nar hebya.',
          instruction_ar: 'حضّر المكونات وقلّها على نار هادئة.',
        },
      ],
      chef_tip: {
        fr: 'Astuce : servir avec un filet d\'huile d\'olive fraîche.',
        derja: 'Zid chwaya zit zitouna 7or fel lekher.',
        ar: 'أضف رشة زيت زيتون بكر عند التقديم.',
      },
      is_published: true,
    });
    setIsRecipeModalOpen(true);
  };

  const handleSaveRecipeModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecipe) return;
    if (!editingRecipe.name_fr.trim()) {
      alert('Le nom de la recette en français est obligatoire.');
      return;
    }
    // Video: empty = no video; otherwise it must be a valid YouTube link (stored in a clean form)
    const rawVideo = editingRecipe.video_url?.trim() ?? '';
    if (rawVideo && !parseYouTubeId(rawVideo)) {
      alert('Le lien vidéo doit être un lien YouTube valide (ou laissez le champ vide).');
      return;
    }
    // Readable, unique address for new recipes (/recette/<slug>) instead of "recette-<timestamp>"
    if (!editingRecipe.slug || /^recette-\d+$/.test(editingRecipe.slug)) {
      const base = slugify(editingRecipe.name_fr) || 'recette';
      let slug = base;
      for (let k = 2; recipes.some((r) => r.slug === slug && r.id !== editingRecipe.id); k++) slug = `${base}-${k}`;
      editingRecipe.slug = slug;
    }
    const { video_url: _ignored, ...withoutVideo } = editingRecipe;
    const video_url = normalizeYouTubeUrl(rawVideo);
    const toSave: Recipe = video_url ? { ...withoutVideo, video_url } : withoutVideo;
    const result = await saveRecipeToFirestore(toSave);
    onRefreshData();
    setIsRecipeModalOpen(false);
    setEditingRecipe(null);
    reportCloud(result, 'Recette enregistrée et synchronisée');
  };

  // Cloud Firestore Sync actions
  const handlePushAllToFirestore = async () => {
    setIsCloudSyncing(true);
    try {
      reportCloud(await pushAllToFirestore(), 'Recettes et ingrédients envoyés vers Firestore');
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleInitializeCloudCatalog = async () => {
    const ok = window.confirm(
      `Initialiser la base avec le catalogue intégré (${initialRecipes.length} recettes) ?\n\n` +
        '- Les recettes et ingrédients du catalogue remplacent ceux du cloud.\n' +
        '- Les recettes et ingrédients du cloud absents du catalogue sont supprimés.\n\n' +
        'Pensez à télécharger une sauvegarde JSON avant.'
    );
    if (!ok) return;
    setIsCloudSyncing(true);
    try {
      const result = await initializeCloudCatalog();
      onRefreshData();
      if (result.ok && result.stats) {
        const { recipes: r, ingredients: i, deleted } = result.stats;
        showToast(`Base initialisée : ${r} recettes, ${i} ingrédients, ${deleted} anciens éléments supprimés`);
      } else reportCloud(result, '');
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handlePullAllFromFirestore = async () => {
    setIsCloudSyncing(true);
    try {
      await syncRecipesFromFirestore();
      await syncIngredientsFromFirestore();
      onRefreshData();
      showToast('Recettes et ingrédients rechargés depuis Firestore');
    } catch {
      showToast('Erreur lors de la récupération Firestore.', true);
    } finally {
      setIsCloudSyncing(false);
    }
  };


  // Ingredient Price Updates
  const handlePriceChange = (id: string, val: string) => {
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setPriceEdits((prev) => ({ ...prev, [id]: num }));
    }
  };

  const handleSaveAllPrices = async () => {
    let lastFailure: CloudWriteResult | null = null;
    for (const [id, price] of Object.entries(priceEdits)) {
      const ing = ingredients.find((i) => i.id === id);
      if (!ing) continue;
      const result = await saveIngredientToFirestore({ ...ing, default_price_tnd: price });
      if (!result.ok) lastFailure = result;
    }
    setPriceEdits({});
    onRefreshData();
    reportCloud(lastFailure ?? { ok: true }, 'Prix du marché mis à jour');
  };

  const handleAddIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIngNameFr.trim()) return;
    const created = storage.addCustomIngredient({
      name_fr: newIngNameFr.trim(),
      name_derja: newIngNameDerja.trim() || newIngNameFr.trim(),
      name_ar: newIngNameAr.trim() || newIngNameFr.trim(),
      category: newIngCategory,
      unit_default: newIngUnit,
      default_price_tnd: newIngPrice,
    });
    setNewIngNameFr('');
    setNewIngNameDerja('');
    setNewIngNameAr('');
    const result = await saveIngredientToFirestore(created);
    onRefreshData();
    reportCloud(result, 'Nouvel ingrédient ajouté au catalogue');
  };

  // Backup & Restore
  const handleDownloadBackup = () => {
    const jsonStr = storage.exportFullBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chnowa-ntayeb-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Sauvegarde JSON téléchargée !');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = storage.importFullBackup(content);
      if (success) {
        onRefreshData();
        showToast('Données importées avec succès !');
      } else {
        alert('Erreur lors de la lecture du fichier JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Voulez-vous vraiment restaurer le catalogue de recettes tunisiennes par défaut ?')) {
      storage.resetToDefaults();
      onRefreshData();
      showToast('Catalogue réinitialisé avec succès !');
    }
  };

  const filteredRecipes = recipes.filter((r) => {
    if (!recipeSearch.trim()) return true;
    const q = recipeSearch.toLowerCase().trim();
    return (
      r.name_fr.toLowerCase().includes(q) ||
      r.name_derja.toLowerCase().includes(q) ||
      r.name_ar.toLowerCase().includes(q)
    );
  });

  const filteredIngredients = ingredients.filter((ing) => {
    if (!ingredientSearch.trim()) return true;
    const q = ingredientSearch.toLowerCase().trim();
    return (
      ing.name_fr.toLowerCase().includes(q) ||
      ing.name_derja.toLowerCase().includes(q) ||
      ing.name_ar.toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full space-y-6 text-ink">
      {/* Toast Notification */}
      {toast && (
        <div
          role={toast.isError ? 'alert' : 'status'}
          className={`fixed top-20 right-4 left-4 sm:left-auto sm:max-w-sm z-50 p-3 rounded-xl text-xs font-bold shadow-xl flex items-start gap-2 animate-fade-in ${
            toast.isError ? 'bg-rose-600 text-white' : 'bg-brand text-on-brand'
          }`}
        >
          {toast.isError ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <Check className="w-4 h-4 stroke-[3] shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Cloud status banner: without a Firebase patron session, changes stay on this device */}
      {cloudStatus === 'local-only' && (
        <div className="flex items-start gap-3 p-4 rounded-2xl border border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200">
          <CloudOff className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <p className="font-bold text-sm">Mode local uniquement</p>
            <p>
              Le serveur n'a pas pu relier ta session patron à Firebase (variable <code>FIREBASE_SERVICE_ACCOUNT</code>{' '}
              absente ou invalide). Tes modifications sont enregistrées sur cet appareil mais ne sont pas publiées pour les
              autres utilisateurs.
            </p>
          </div>
        </div>
      )}

      {/* Backoffice Header with Patron Session & Logout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-line shadow-xs">
        <div className="flex items-center justify-between sm:justify-start gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-accent text-on-accent text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Accès Patron
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-ink">
                {t.boTitle}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Gestionnaire central des recettes tunisiennes & synchronisation Firebase (/patron)
            </p>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="sm:hidden p-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-bold flex items-center gap-1"
              title="Déconnexion Patron"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {onLogout && (
            <button
              onClick={onLogout}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 text-xs font-bold hover:bg-rose-100 transition"
              title="Fermer la session patron"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Déconnexion Patron</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation Strip */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-700/60 overflow-x-auto">

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'dashboard'
                ? 'bg-card text-ink shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>{t.boTabDashboard}</span>
          </button>

          <button
            onClick={() => setActiveTab('recipes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'recipes'
                ? 'bg-card text-ink shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>{t.boTabRecipes} ({recipes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ingredients')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'ingredients'
                ? 'bg-card text-ink shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <Carrot className="w-3.5 h-3.5" />
            <span>{t.boTabIngredients}</span>
          </button>

          <button
            onClick={() => setActiveTab('themes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'themes'
                ? 'bg-card text-ink shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Thèmes</span>
          </button>

          <button
            onClick={() => setActiveTab('data')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'data'
                ? 'bg-card text-ink shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>{t.boTabData}</span>
          </button>
        </div>

      {/* TAB 1: DASHBOARD */}

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* KPI Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-card border border-line shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {t.boTotalRecipes}
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-ink mt-1">
                {totalCount}
              </p>
              <p className="text-xs text-emerald-600 mt-1 font-medium">
                {publishedCount} publiées · {totalCount - publishedCount} brouillons
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-line shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Ingrédients répertoriés
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-brand-text mt-1">
                {ingredients.length}
              </p>
              <p className={`text-xs mt-1 ${unusedIngredients.length > 0 ? 'text-amber-600 font-semibold' : 'text-slate-500'}`}>
                {unusedIngredients.length > 0
                  ? `${unusedIngredients.length} sans aucune recette`
                  : 'Tous utilisés par une recette'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-line shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {t.boAvgCost}
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-accent-text mt-1">
                {avgCost} DT
              </p>
              <p className="text-xs text-slate-500 mt-1">Par repas pour 4 personnes</p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-line shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Temps moyen
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-highlight mt-1">
                {avgTime} min
              </p>
              <p className="text-xs text-slate-500 mt-1">Préparation & cuisson</p>
            </div>
          </div>

          {/* Quick Actions Strip */}
          <div className="p-5 rounded-2xl bg-card border border-line space-y-3">
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
              Actions rapides
            </h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleOpenAddRecipe}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-on-brand text-xs sm:text-sm font-bold hover:bg-brand-strong transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>{t.boAddRecipe}</span>
              </button>

              <button
                onClick={() => setActiveTab('ingredients')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-100 text-xs sm:text-sm font-semibold hover:border-slate-400 transition"
              >
                <Coins className="w-4 h-4 text-accent-text" />
                <span>Mettre à jour les prix du marché (DT)</span>
              </button>

              <button
                onClick={handleDownloadBackup}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-100 text-xs sm:text-sm font-semibold hover:border-slate-400 transition"
              >
                <Download className="w-4 h-4 text-blue-500" />
                <span>Télécharger une sauvegarde</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RECIPES MANAGEMENT */}
      {activeTab === 'recipes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={recipeSearch}
                onChange={(e) => setRecipeSearch(e.target.value)}
                placeholder="Rechercher une recette par nom..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-card border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
              />
            </div>
            <button
              onClick={handleOpenAddRecipe}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-on-brand text-xs sm:text-sm font-bold hover:bg-brand-strong transition shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{t.boAddRecipe}</span>
            </button>
          </div>

          {/* Recipes Table / List */}
          <div className="divide-y divide-slate-100 dark:divide-slate-700/80 rounded-2xl bg-card border border-line overflow-hidden shadow-xs">
            {filteredRecipes.map((r) => (
              <div
                key={r.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 shrink-0">
                    {r.image_url ? (
                      <img
                        src={r.image_url}
                        alt={r.name_fr}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <img src="/mark.png" alt="" className="w-full h-full object-contain p-1.5 opacity-70" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-ink">
                        {r.name_fr}
                      </span>
                      {r.name_derja && (
                        <span className="text-xs text-accent-text font-semibold">
                          ({r.name_derja})
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1 mt-1">
                      <RecipeBadges recipe={r} />
                      {parseYouTubeId(r.video_url) && (
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                          ▶ Vidéo
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span>{r.prep_time_minutes + r.cook_time_minutes} min</span>
                      <span>·</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {r.estimated_cost_tnd} DT
                      </span>
                      <span>·</span>
                      <span className="capitalize">{r.cuisine_type}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleTogglePublish(r)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                      r.is_published
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                    }`}
                  >
                    {r.is_published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{r.is_published ? 'En ligne' : 'Brouillon'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingRecipe(r);
                      setIsRecipeModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                    title={t.boEditRecipe}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteRecipe(r.id, r.name_fr)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-500"
                    title={t.boDeleteRecipe}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: INGREDIENTS & MARKET PRICES */}
      {activeTab === 'ingredients' && (
        <div className="space-y-6">
          {/* Add New Ingredient Form */}
          <form
            onSubmit={handleAddIngredient}
            className="p-5 rounded-2xl bg-card border border-line space-y-3"
          >
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
              Ajouter un ingrédient au catalogue
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <input
                type="text"
                value={newIngNameFr}
                onChange={(e) => setNewIngNameFr(e.target.value)}
                placeholder="Nom Français (ex: Câpres)"
                className="px-3 py-2 text-xs sm:text-sm rounded-xl bg-surface border border-slate-200 dark:border-slate-700"
                required
              />
              <input
                type="text"
                value={newIngNameDerja}
                onChange={(e) => setNewIngNameDerja(e.target.value)}
                placeholder="Nom Derja Arabizi (ex: Kabbara)"
                className="px-3 py-2 text-xs sm:text-sm rounded-xl bg-surface border border-slate-200 dark:border-slate-700"
              />
              <input
                type="text"
                value={newIngNameAr}
                onChange={(e) => setNewIngNameAr(e.target.value)}
                placeholder="Nom Arabe (ex: كبار)"
                className="px-3 py-2 text-xs sm:text-sm rounded-xl bg-surface border border-slate-200 dark:border-slate-700"
              />
              <select
                value={newIngCategory}
                onChange={(e) => setNewIngCategory(e.target.value as IngredientCategory)}
                className="px-3 py-2 text-xs sm:text-sm rounded-xl bg-surface border border-slate-200 dark:border-slate-700"
              >
                <option value="vegetables">{t.catVegetables}</option>
                <option value="fruits">{t.catFruits}</option>
                <option value="meats">{t.catMeats}</option>
                <option value="fish">{t.catFish}</option>
                <option value="dairy_eggs">{t.catDairyEggs}</option>
                <option value="grains_pasta">{t.catGrainsPasta}</option>
                <option value="spices_condiments">{t.catSpicesCondiments}</option>
                <option value="canned_pantry">{t.catCannedPantry}</option>
                <option value="other">{t.catOther}</option>
              </select>
              <input
                type="text"
                value={newIngUnit}
                onChange={(e) => setNewIngUnit(e.target.value)}
                placeholder="Unité (ex: kg, pièce, boîte...)"
                className="px-3 py-2 text-xs sm:text-sm rounded-xl bg-surface border border-slate-200 dark:border-slate-700"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={newIngPrice}
                  onChange={(e) => setNewIngPrice(parseFloat(e.target.value) || 0)}
                  placeholder="Prix unitaire DT"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-surface border border-slate-200 dark:border-slate-700"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand text-on-brand text-xs font-bold hover:bg-brand-strong transition shrink-0"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </form>

          {/* Pricing Table */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={ingredientSearch}
                  onChange={(e) => setIngredientSearch(e.target.value)}
                  placeholder="Filtrer les ingrédients..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-card border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
                />
              </div>

              {Object.keys(priceEdits).length > 0 && (
                <button
                  onClick={handleSaveAllPrices}
                  className="px-4 py-2 rounded-xl bg-accent text-on-accent text-xs sm:text-sm font-bold hover:bg-accent-strong transition shadow-md shrink-0"
                >
                  Enregistrer les prix modifiés ({Object.keys(priceEdits).length})
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-700/80 rounded-2xl bg-card border border-line overflow-hidden shadow-xs">
              {filteredIngredients.map((ing) => {
                const currentPrice =
                  priceEdits[ing.id] !== undefined ? priceEdits[ing.id] : ing.default_price_tnd;

                return (
                  <div
                    key={ing.id}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition"
                  >
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-ink">
                        {ing.name_fr}
                        {ing.name_derja && (
                          <span className="text-xs text-accent-text font-semibold ml-1.5">
                            ({ing.name_derja})
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-400 capitalize">
                        {ing.category} · Unité : {ing.unit_default}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.1"
                          value={currentPrice}
                          onChange={(e) => handlePriceChange(ing.id, e.target.value)}
                          className="w-20 px-2 py-1 text-xs font-bold text-right rounded-lg bg-surface border border-slate-200 dark:border-slate-700"
                        />
                        <span className="text-xs font-bold text-slate-500">DT</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DATA & BACKUP */}
      {activeTab === 'data' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-card border border-line space-y-4">
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
              Sauvegarde et Restauration du Catalogue
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Toutes vos recettes, ingrédients, prix en DT et menus sont stockés localement dans votre navigateur sans aucun frais de serveur. Vous pouvez exporter une sauvegarde JSON à tout moment.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <button
                onClick={handleDownloadBackup}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-surface hover:border-brand transition flex flex-col items-center text-center gap-2"
              >
                <Download className="w-6 h-6 text-brand-text" />
                <span className="text-xs font-bold text-ink">
                  Exporter la base (JSON)
                </span>
                <span className="text-[10px] text-slate-400">
                  Télécharge toutes les recettes et les prix
                </span>
              </button>

              <label className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-surface hover:border-accent transition flex flex-col items-center text-center gap-2 cursor-pointer">
                <Upload className="w-6 h-6 text-accent-text" />
                <span className="text-xs font-bold text-ink">
                  Importer un fichier JSON
                </span>
                <span className="text-[10px] text-slate-400">
                  Restaure une sauvegarde existante
                </span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleResetDefaults}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-surface hover:border-rose-400 transition flex flex-col items-center text-center gap-2"
              >
                <RotateCcw className="w-6 h-6 text-rose-500" />
                <span className="text-xs font-bold text-ink">
                  Restaurer les recettes d'origine
                </span>
                <span className="text-[10px] text-slate-400">
                  Recharge le catalogue intégré ({initialRecipes.length} recettes) sur cet appareil
                </span>
              </button>
            </div>
          </div>

          {/* Firebase Cloud Firestore Sync Box */}
          <div className="p-5 rounded-2xl bg-card border border-line space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand to-brand-strong text-white flex items-center justify-center shadow-sm">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
                    Base de Données Cloud Firebase (Firestore)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Projet : <code className="font-mono text-accent-text">{firebaseConfig.projectId}</code> · Synchronisation temps réel
                  </p>
                </div>
              </div>
              {cloudStatus === 'connected' ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Connecté
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200 text-xs font-bold flex items-center gap-1.5">
                  <CloudOff className="w-3.5 h-3.5" />
                  Local
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Vos recettes peuvent être répliquées sur Firestore pour être accessibles instantanément depuis n'importe quel appareil tout en restant 100% fonctionnelles en mode hors ligne.
            </p>

            <div className="flex flex-wrap gap-3 pt-1">
              <button
                onClick={handlePushAllToFirestore}
                disabled={isCloudSyncing}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-on-brand text-xs font-bold hover:bg-brand-strong transition shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                <span>Pousser tout vers Firestore Cloud</span>
              </button>

              <button
                onClick={handlePullAllFromFirestore}
                disabled={isCloudSyncing}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:border-slate-400 transition disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-accent-text" />
                <span>Recharger depuis Firestore</span>
              </button>

              <button
                onClick={handleInitializeCloudCatalog}
                disabled={isCloudSyncing || cloudStatus !== 'connected'}
                title={cloudStatus !== 'connected' ? 'Session cloud requise' : undefined}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-300 text-xs font-semibold hover:border-rose-500 transition disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Initialiser la base avec le catalogue intégré</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: THEMES */}
      {activeTab === 'themes' && <ThemeEditor onNotify={showToast} />}

      {/* RECIPE EDIT / ADD MODAL */}
      {isRecipeModalOpen && editingRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-surface rounded-2xl border border-line p-5 sm:p-6 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-extrabold text-base text-ink">
                {editingRecipe.name_fr ? `Modifier : ${editingRecipe.name_fr}` : t.boAddRecipe}
              </h3>
              <button
                onClick={() => setIsRecipeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecipeModal} className="flex-1 overflow-y-auto py-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Nom Français *
                  </label>
                  <input
                    type="text"
                    value={editingRecipe.name_fr}
                    onChange={(e) => setEditingRecipe({ ...editingRecipe, name_fr: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-card border border-slate-200 dark:border-slate-700 mt-1"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Nom Derja Arabizi (3, 7, 9)
                  </label>
                  <input
                    type="text"
                    value={editingRecipe.name_derja}
                    onChange={(e) => setEditingRecipe({ ...editingRecipe, name_derja: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-card border border-slate-200 dark:border-slate-700 mt-1"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Nom Arabe
                  </label>
                  <input
                    type="text"
                    value={editingRecipe.name_ar}
                    onChange={(e) => setEditingRecipe({ ...editingRecipe, name_ar: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-card border border-slate-200 dark:border-slate-700 mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  Description
                </label>
                <textarea
                  value={editingRecipe.description_fr}
                  onChange={(e) => setEditingRecipe({ ...editingRecipe, description_fr: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-card border border-slate-200 dark:border-slate-700 mt-1"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Préparation (min)
                  </label>
                  <input
                    type="number"
                    value={editingRecipe.prep_time_minutes}
                    onChange={(e) => setEditingRecipe({ ...editingRecipe, prep_time_minutes: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-card border border-slate-200 dark:border-slate-700 mt-1"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Cuisson (min)
                  </label>
                  <input
                    type="number"
                    value={editingRecipe.cook_time_minutes}
                    onChange={(e) => setEditingRecipe({ ...editingRecipe, cook_time_minutes: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-card border border-slate-200 dark:border-slate-700 mt-1"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Prix estimé (DT)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={editingRecipe.estimated_cost_tnd}
                    onChange={(e) => setEditingRecipe({ ...editingRecipe, estimated_cost_tnd: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-card border border-slate-200 dark:border-slate-700 mt-1"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Portions base
                  </label>
                  <input
                    type="number"
                    value={editingRecipe.base_servings}
                    onChange={(e) => setEditingRecipe({ ...editingRecipe, base_servings: parseInt(e.target.value) || 4 })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-card border border-slate-200 dark:border-slate-700 mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  URL de l'image
                </label>
                <input
                  type="text"
                  value={editingRecipe.image_url}
                  onChange={(e) => setEditingRecipe({ ...editingRecipe, image_url: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-card border border-slate-200 dark:border-slate-700 mt-1"
                />
              </div>

              {/* Optional how-to video */}
              {(() => {
                const rawVideo = editingRecipe.video_url ?? '';
                const videoId = parseYouTubeId(rawVideo);
                const invalid = rawVideo.trim() !== '' && !videoId;
                return (
                  <div>
                    <label htmlFor="recipe-video" className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      Vidéo de préparation (lien YouTube, optionnel)
                    </label>
                    <div className="flex gap-3 mt-1 items-start">
                      <div className="flex-1 min-w-0">
                        <input
                          id="recipe-video"
                          type="url"
                          inputMode="url"
                          value={rawVideo}
                          onChange={(e) => setEditingRecipe({ ...editingRecipe, video_url: e.target.value })}
                          placeholder="https://www.youtube.com/watch?v=… ou https://youtu.be/…"
                          aria-invalid={invalid}
                          className={`w-full px-3 py-2 text-xs rounded-lg bg-card border ${
                            invalid ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                          }`}
                        />
                        <p className={`text-[10px] mt-1 ${invalid ? 'text-rose-600 font-semibold' : 'text-ink-muted'}`}>
                          {invalid
                            ? 'Lien non reconnu : utilisez un lien youtube.com, youtu.be ou shorts.'
                            : videoId
                              ? 'Vidéo reconnue : elle s\'affichera dans la fiche de la recette.'
                              : 'Laissez vide si la recette n\'a pas de vidéo : rien ne sera affiché.'}
                        </p>
                      </div>
                      {videoId && (
                        <div className="relative w-28 shrink-0 aspect-video rounded-lg overflow-hidden bg-slate-900 ring-1 ring-line">
                          <img src={youTubeThumbnail(videoId)} alt="Aperçu de la vidéo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <span className="absolute inset-0 flex items-center justify-center">
                            <span className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-accent text-xs">▶</span>
                          </span>
                          {editingRecipe.video_url && (
                            <button
                              type="button"
                              onClick={() => setEditingRecipe({ ...editingRecipe, video_url: '' })}
                              aria-label="Retirer la vidéo"
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white text-[10px] leading-none"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Catégorie
                  </label>
                  <select
                    value={normalizeCategory(editingRecipe.category)}
                    onChange={(e) => setEditingRecipe({ ...editingRecipe, category: e.target.value as MealCategory })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-card border border-slate-200 dark:border-slate-700 mt-1"
                  >
                    <option value="entree">Entrée (salades, soupes, brik…)</option>
                    <option value="plat_principal">Plat principal</option>
                    <option value="dessert">Dessert</option>
                  </select>
                  <p className="text-[10px] text-ink-muted mt-1">
                    « Express » est ajouté automatiquement si la recette prend 20 min ou moins.
                  </p>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Type de cuisine
                  </label>
                  <select
                    value={editingRecipe.cuisine_type}
                    onChange={(e) => setEditingRecipe({ ...editingRecipe, cuisine_type: e.target.value as CuisineType })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-card border border-slate-200 dark:border-slate-700 mt-1"
                  >
                    <option value="traditionnelle">Traditionnelle</option>
                    <option value="rapide">Rapide</option>
                    <option value="economique">Économique</option>
                    <option value="familiale">Familiale</option>
                    <option value="vegetarienne">Végétarienne</option>
                    <option value="internationale">Internationale</option>
                  </select>
                </div>
              </div>

              {/* Healthy flag: badge, recipe filter and "menu healthy" generation */}
              <label className="flex items-start gap-2 p-3 rounded-xl bg-card border border-line cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!editingRecipe.is_healthy}
                  onChange={(e) => setEditingRecipe({ ...editingRecipe, is_healthy: e.target.checked })}
                  className="accent-brand w-4 h-4 mt-0.5"
                />
                <span className="text-xs">
                  <span className="font-bold text-ink">Plat équilibré / healthy</span>
                  <span className="block text-ink-muted">
                    Léger, riche en légumes, peu de friture ou de sucre. Affiche le badge Healthy et l'inclut dans les
                    filtres et menus healthy.
                  </span>
                </span>
              </label>

              {/* Ingredients with their role for the matching engine */}
              <RecipeIngredientsEditor
                items={editingRecipe.ingredients}
                catalog={ingredients}
                onChange={(items) => setEditingRecipe({ ...editingRecipe, ingredients: items })}
              />

              {/* Chef tip */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  Astuce du Chef Tounsi
                </label>
                <input
                  type="text"
                  value={editingRecipe.chef_tip.fr}
                  onChange={(e) =>
                    setEditingRecipe({
                      ...editingRecipe,
                      chef_tip: { ...editingRecipe.chef_tip, fr: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg bg-card border border-slate-200 dark:border-slate-700 mt-1"
                  placeholder="Ex: Ne jamais battre les œufs dans une vraie ojja !"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsRecipeModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  {t.boCancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand text-on-brand text-xs font-bold hover:bg-brand-strong shadow-sm transition"
                >
                  {t.boSave}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
