import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Copy, Pencil, Trash2, Eye, EyeOff, Save, X, FlaskConical, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import {
  AppTheme,
  ThemeColors,
  THEME_COLOR_KEYS,
  DISPLAY_FONTS,
  CARD_SHAPES,
  THEME_PATTERNS,
  DisplayFont,
  CardShape,
  ThemePattern,
} from '../types';
import { BUILTIN_THEMES } from '../data/builtinThemes';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { fetchThemesFromFirestore, saveThemeToFirestore, deleteThemeFromFirestore } from '../services/themeSync';
import { contrastRatio, CONTRAST_PAIRS, FONT_REGISTRY, isHexColor, validateTheme } from '../services/themeValidation';
import { storage } from '../services/storage';
import { ThemePreviewCard } from './ThemePreviewCard';
import { useCloseOnBack } from '../hooks/useBackNavigation';

const COLOR_LABELS: Record<keyof ThemeColors, string> = {
  brand: 'Couleur principale',
  brandStrong: 'Principale (survol)',
  brandText: 'Principale en texte',
  onBrand: 'Texte sur principale',
  accent: "Couleur d'action",
  accentStrong: 'Action (survol)',
  accentText: 'Action en texte',
  onAccent: 'Texte sur action',
  highlight: 'Touche décorative',
  surface: 'Fond de page',
  card: 'Fond des cartes',
  line: 'Bordures',
  ink: 'Texte principal',
  inkMuted: 'Texte secondaire',
  heroFrom: 'Bandeau (début)',
  heroTo: 'Bandeau (fin)',
};

const SHAPE_LABELS: Record<CardShape, string> = { rounded: 'Arrondie', arch: 'Arche (médina)', square: 'Carrée' };
const PATTERN_LABELS: Record<ThemePattern, string> = {
  none: 'Aucun',
  zellige: 'Frise zellige',
  dots: 'Points',
  waves: 'Vagues',
};

interface ThemeEditorProps {
  onNotify: (message: string, isError?: boolean) => void;
}

function newThemeId() {
  return `theme_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export const ThemeEditor: React.FC<ThemeEditorProps> = ({ onNotify }) => {
  const { getThemeName } = useLanguage();
  const { setPreviewTheme, isPreviewing, refreshThemes } = useTheme();
  const [remoteThemes, setRemoteThemes] = useState<AppTheme[]>(() => storage.getCachedThemes());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [draft, setDraft] = useState<AppTheme | null>(null);
  const [colorMode, setColorMode] = useState<'light' | 'dark'>('light');

  const loadThemes = useCallback(async () => {
    setIsLoading(true);
    const list = await fetchThemesFromFirestore(true);
    if (list) setRemoteThemes(list);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadThemes();
  }, [loadThemes]);

  // Stop any "try it on me" preview when leaving the editor
  useEffect(() => () => setPreviewTheme(null), [setPreviewTheme]);

  // While previewing, follow the edits live (only valid themes are applied)
  useEffect(() => {
    if (isPreviewing && draft && validateTheme(draft).length === 0) setPreviewTheme(draft);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  const closeEditor = () => {
    setDraft(null);
    setPreviewTheme(null);
  };
  useCloseOnBack(!!draft, closeEditor);

  const allThemes = useMemo(() => [...BUILTIN_THEMES, ...remoteThemes], [remoteThemes]);
  const errors = draft ? validateTheme(draft) : [];

  const startDuplicate = (source: AppTheme) => {
    const copy: AppTheme = {
      ...structuredClone(source),
      id: newThemeId(),
      name_fr: `${source.name_fr} (copie)`.slice(0, 60),
      name_derja: `${source.name_derja} (copie)`.slice(0, 60),
      name_ar: `${source.name_ar} (نسخة)`.slice(0, 60),
      is_published: false,
      is_builtin: false,
    };
    delete copy.updated_at;
    setColorMode('light');
    setDraft(copy);
  };

  const startEdit = (theme: AppTheme) => {
    setColorMode('light');
    setDraft(structuredClone(theme));
  };

  const updateColor = (key: keyof ThemeColors, value: string) => {
    if (!draft) return;
    setDraft({ ...draft, [colorMode]: { ...draft[colorMode], [key]: value } });
  };

  const handleSave = async () => {
    if (!draft || errors.length > 0) return;
    setIsSaving(true);
    const result = await saveThemeToFirestore(draft);
    setIsSaving(false);
    if (!result.ok) {
      onNotify(`Thème non enregistré : ${result.error}`, true);
      return;
    }
    onNotify(draft.is_published ? 'Thème enregistré et publié pour tous' : 'Thème enregistré en brouillon');
    closeEditor();
    await loadThemes();
    await refreshThemes();
  };

  const togglePublish = async (theme: AppTheme) => {
    const result = await saveThemeToFirestore({ ...theme, is_published: !theme.is_published });
    if (!result.ok) return onNotify(result.error, true);
    onNotify(theme.is_published ? 'Thème retiré (les utilisateurs repassent sur Classique)' : 'Thème publié pour tous');
    await loadThemes();
    await refreshThemes();
  };

  const handleDelete = async (theme: AppTheme) => {
    if (!window.confirm(`Supprimer définitivement le thème "${theme.name_fr}" ?`)) return;
    const result = await deleteThemeFromFirestore(theme.id);
    if (!result.ok) return onNotify(result.error, true);
    onNotify('Thème supprimé');
    await loadThemes();
    await refreshThemes();
  };

  // -------------------------------------------------------------------------
  // Editor
  // -------------------------------------------------------------------------
  if (draft) {
    const colors = draft[colorMode];
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-lg font-extrabold text-ink">
            {remoteThemes.some((t) => t.id === draft.id) ? `Modifier : ${draft.name_fr}` : 'Nouveau thème'}
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPreviewTheme(isPreviewing ? null : draft)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-line bg-card text-xs font-semibold text-ink hover:border-brand"
            >
              <FlaskConical className="w-4 h-4 text-accent-text" />
              {isPreviewing ? "Arrêter l'aperçu" : 'Tester sur moi'}
            </button>
            <button
              type="button"
              onClick={closeEditor}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-ink-muted hover:text-ink"
            >
              <X className="w-4 h-4" />
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || errors.length > 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-on-brand text-xs font-bold hover:bg-brand-strong disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Enregistrer
            </button>
          </div>
        </div>

        {isPreviewing && (
          <p className="text-xs text-accent-text font-semibold">
            Aperçu actif : toute l'application utilise ce thème sur ton appareil uniquement. Les autres ne voient rien
            tant que le thème n'est pas publié.
          </p>
        )}

        {errors.length > 0 && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-200 text-xs space-y-0.5">
            {errors.map((err) => (
              <p key={err}>• {err}</p>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-5">
          <div className="space-y-5">
            {/* Names */}
            <section className="p-4 rounded-2xl bg-card border border-line space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted">Nom du thème</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(
                  [
                    ['name_fr', 'Français'],
                    ['name_derja', 'Derja'],
                    ['name_ar', 'Arabe'],
                  ] as const
                ).map(([field, label]) => (
                  <label key={field} className="text-[11px] font-bold text-ink-muted">
                    {label}
                    <input
                      type="text"
                      maxLength={60}
                      dir={field === 'name_ar' ? 'rtl' : undefined}
                      value={draft[field]}
                      onChange={(e) => setDraft({ ...draft, [field]: e.target.value })}
                      className="mt-1 w-full px-3 py-2 text-xs rounded-lg bg-surface border border-line text-ink"
                    />
                  </label>
                ))}
              </div>
            </section>

            {/* Style */}
            <section className="p-4 rounded-2xl bg-card border border-line space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted">Style</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="text-[11px] font-bold text-ink-muted">
                  Police des titres
                  <select
                    value={draft.displayFont}
                    onChange={(e) => setDraft({ ...draft, displayFont: e.target.value as DisplayFont })}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-lg bg-surface border border-line text-ink"
                  >
                    {DISPLAY_FONTS.map((f) => (
                      <option key={f} value={f}>
                        {FONT_REGISTRY[f].label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-[11px] font-bold text-ink-muted">
                  Forme des cartes
                  <select
                    value={draft.cardShape}
                    onChange={(e) => setDraft({ ...draft, cardShape: e.target.value as CardShape })}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-lg bg-surface border border-line text-ink"
                  >
                    {CARD_SHAPES.map((s) => (
                      <option key={s} value={s}>
                        {SHAPE_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-[11px] font-bold text-ink-muted">
                  Motif décoratif
                  <select
                    value={draft.pattern}
                    onChange={(e) => setDraft({ ...draft, pattern: e.target.value as ThemePattern })}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-lg bg-surface border border-line text-ink"
                  >
                    {THEME_PATTERNS.map((p) => (
                      <option key={p} value={p}>
                        {PATTERN_LABELS[p]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-ink">
                <input
                  type="checkbox"
                  checked={draft.is_published}
                  onChange={(e) => setDraft({ ...draft, is_published: e.target.checked })}
                  className="accent-brand w-4 h-4"
                />
                Publier pour tous les utilisateurs
              </label>
            </section>

            {/* Colors */}
            <section className="p-4 rounded-2xl bg-card border border-line space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted">Couleurs</h4>
                <div role="radiogroup" className="inline-flex p-1 rounded-lg bg-surface border border-line">
                  {(['light', 'dark'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      role="radio"
                      aria-checked={colorMode === m}
                      onClick={() => setColorMode(m)}
                      className={`px-3 py-1 rounded-md text-xs font-semibold ${
                        colorMode === m ? 'bg-brand text-on-brand' : 'text-ink-muted'
                      }`}
                    >
                      {m === 'light' ? 'Mode clair' : 'Mode sombre'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
                {THEME_COLOR_KEYS.map((key) => {
                  const value = colors[key];
                  const valid = isHexColor(value);
                  return (
                    <label key={key} className="flex items-center gap-2.5 text-xs text-ink">
                      <input
                        type="color"
                        value={valid ? value : '#000000'}
                        onChange={(e) => updateColor(key, e.target.value.toUpperCase())}
                        aria-label={COLOR_LABELS[key]}
                        className="w-9 h-9 rounded-lg border border-line bg-transparent cursor-pointer shrink-0"
                      />
                      <span className="flex-1 font-medium">{COLOR_LABELS[key]}</span>
                      <input
                        type="text"
                        value={value}
                        maxLength={7}
                        onChange={(e) => updateColor(key, e.target.value)}
                        className={`w-20 px-2 py-1 rounded-md font-mono text-[11px] bg-surface border ${
                          valid ? 'border-line text-ink' : 'border-rose-500 text-rose-600'
                        }`}
                      />
                    </label>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Live preview + contrast */}
          <aside className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted">Aperçu</h4>
              {errors.length === 0 ? (
                <>
                  <ThemePreviewCard theme={draft} name={getThemeName(draft)} dark={false} />
                  <ThemePreviewCard theme={draft} name={getThemeName(draft)} dark />
                </>
              ) : (
                <p className="text-xs text-ink-muted">Corrige les erreurs pour voir l'aperçu.</p>
              )}
            </div>
            <div className="p-3 rounded-2xl bg-card border border-line space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                Lisibilité ({colorMode === 'light' ? 'clair' : 'sombre'})
              </h4>
              {CONTRAST_PAIRS.map(({ fg, bg, label }) => {
                const ratio = contrastRatio(colors[fg], colors[bg]);
                const ok = ratio >= 4.5;
                return (
                  <div key={label} className="flex items-center gap-2 text-[11px]">
                    {ok ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    )}
                    <span className="flex-1 text-ink">{label}</span>
                    <span className={`font-mono font-bold ${ok ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {ratio.toFixed(1)}:1
                    </span>
                  </div>
                );
              })}
              <p className="text-[10px] text-ink-muted">Recommandé : au moins 4,5:1 pour du texte.</p>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Theme list
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-extrabold text-ink">Thèmes de l'application</h3>
          <p className="text-xs text-ink-muted">
            Duplique un thème pour en créer un nouveau. Un thème publié apparaît dans les Réglages de tous les
            utilisateurs.
          </p>
        </div>
        {isLoading && <Loader2 className="w-5 h-5 animate-spin text-ink-muted" />}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {allThemes.map((theme) => {
          const builtin = !!theme.is_builtin;
          return (
            <div key={theme.id} className="p-3 rounded-2xl bg-card border border-line space-y-3">
              <ThemePreviewCard theme={theme} name={getThemeName(theme)} dark={false} />
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    builtin
                      ? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200'
                      : theme.is_published
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200'
                  }`}
                >
                  {builtin ? 'Intégré' : theme.is_published ? 'Publié' : 'Brouillon'}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startDuplicate(theme)}
                    title="Dupliquer"
                    aria-label={`Dupliquer ${theme.name_fr}`}
                    className="p-2 rounded-lg text-ink-muted hover:bg-brand/10 hover:text-brand-text"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  {!builtin && (
                    <>
                      <button
                        onClick={() => startEdit(theme)}
                        title="Modifier"
                        aria-label={`Modifier ${theme.name_fr}`}
                        className="p-2 rounded-lg text-ink-muted hover:bg-brand/10 hover:text-brand-text"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => togglePublish(theme)}
                        title={theme.is_published ? 'Dépublier' : 'Publier'}
                        aria-label={theme.is_published ? `Dépublier ${theme.name_fr}` : `Publier ${theme.name_fr}`}
                        className="p-2 rounded-lg text-ink-muted hover:bg-brand/10 hover:text-brand-text"
                      >
                        {theme.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(theme)}
                        title="Supprimer"
                        aria-label={`Supprimer ${theme.name_fr}`}
                        className="p-2 rounded-lg text-ink-muted hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
