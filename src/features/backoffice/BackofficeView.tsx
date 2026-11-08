import { useRef, useState, type ComponentType } from 'react';
import {
  AlertTriangle,
  Carrot,
  Check,
  CloudOff,
  Database,
  LayoutDashboard,
  LogOut,
  Palette,
  ShieldCheck,
  SlidersHorizontal,
  UtensilsCrossed,
} from 'lucide-react';
import type { Recipe } from '@/core/catalog';
import { useLanguage } from '@/app/providers/LanguageContext';
import { useCatalog, usePatron } from '@/app/ContainerContext';
import { DashboardTab } from './dashboard/DashboardTab';
import { RecipesTab } from './recipes/RecipesTab';
import { RecipeEditorModal } from './recipes/RecipeEditorModal';
import { newRecipeDraft } from './recipes/recipeDraft';
import { IngredientsTab } from './ingredients/IngredientsTab';
import { DataTab } from './data/DataTab';
import { ThemeEditor } from './themes/ThemeEditor';
import { MatchingSettingsPanel } from './matching/MatchingSettingsPanel';
import { useCatalogAdmin } from './useCatalogAdmin';

type Tab = 'dashboard' | 'recipes' | 'ingredients' | 'engine' | 'themes' | 'data';

/** Backoffice frame: notifications, cloud status, patron header and tabs (one component per tab). */
export function BackofficeView({ onLogout }: { onLogout: () => void }) {
  const { t } = useLanguage();
  const { recipes, ingredients } = useCatalog();
  const { cloudStatus } = usePatron();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [editing, setEditing] = useState<Recipe | null>(null);
  const [toast, setToast] = useState<{ message: string; isError: boolean } | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const notify = (message: string, isError = false) => {
    setToast({ message, isError });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), isError ? 6000 : 3500);
  };
  const admin = useCatalogAdmin(notify);
  const addRecipe = () => setEditing(newRecipeDraft());

  const tabs: { id: Tab; label: string; icon: ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: t.boTabDashboard, icon: LayoutDashboard },
    { id: 'recipes', label: `${t.boTabRecipes} (${recipes.length})`, icon: UtensilsCrossed },
    { id: 'ingredients', label: t.boTabIngredients, icon: Carrot },
    { id: 'engine', label: 'Moteur', icon: SlidersHorizontal },
    { id: 'themes', label: 'Thèmes', icon: Palette },
    { id: 'data', label: t.boTabData, icon: Database },
  ];

  return (
    <div className="w-full space-y-6 text-ink">
      {toast && (
        <div
          role={toast.isError ? 'alert' : 'status'}
          className={`fixed top-20 right-4 left-4 sm:left-auto sm:max-w-sm z-50 p-3 rounded-xl text-xs font-bold shadow-xl flex items-start gap-2 animate-fade-in ${
            toast.isError ? 'bg-rose-600 text-white' : 'bg-brand text-on-brand'
          }`}
        >
          {toast.isError ? (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          ) : (
            <Check className="w-4 h-4 stroke-[3] shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Without a cloud session, changes stay on this device */}
      {cloudStatus === 'local-only' && (
        <div className="flex items-start gap-3 p-4 rounded-2xl border border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200">
          <CloudOff className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <p className="font-bold text-sm">Mode local uniquement</p>
            <p>
              Le serveur n'a pas pu relier ta session patron à Firebase (variable <code>FIREBASE_SERVICE_ACCOUNT</code>{' '}
              absente ou invalide). Tes modifications sont enregistrées sur cet appareil mais ne sont pas publiées pour
              les autres utilisateurs.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-line shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-accent text-on-accent text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Accès Patron
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-ink">{t.boTitle}</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gestionnaire central des recettes tunisiennes & synchronisation Firebase (/patron)
          </p>
        </div>
        <button
          onClick={onLogout}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 text-xs font-bold hover:bg-rose-100 transition"
          title="Fermer la session patron"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Déconnexion Patron</span>
        </button>
      </div>

      <div
        role="tablist"
        className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-700/60 overflow-x-auto"
      >
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              tab === id ? 'bg-card text-ink shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <DashboardTab
          recipes={recipes}
          ingredients={ingredients}
          onAddRecipe={addRecipe}
          onOpenIngredients={() => setTab('ingredients')}
          onDownloadBackup={admin.downloadBackup}
        />
      )}
      {tab === 'recipes' && (
        <RecipesTab recipes={recipes} admin={admin} onAddRecipe={addRecipe} onEditRecipe={setEditing} />
      )}
      {tab === 'ingredients' && <IngredientsTab ingredients={ingredients} admin={admin} />}
      {tab === 'engine' && <MatchingSettingsPanel onNotify={notify} />}
      {tab === 'themes' && <ThemeEditor onNotify={notify} />}
      {tab === 'data' && <DataTab admin={admin} cloudStatus={cloudStatus} />}

      {editing && (
        <RecipeEditorModal
          recipe={editing}
          recipes={recipes}
          ingredients={ingredients}
          onClose={() => setEditing(null)}
          onSave={async (recipe) => {
            setEditing(null);
            await admin.saveRecipe(recipe);
          }}
        />
      )}
    </div>
  );
}
