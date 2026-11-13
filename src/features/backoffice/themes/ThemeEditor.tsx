import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Copy,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  FlaskConical,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
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
  BUILTIN_THEMES,
  contrastRatio,
  CONTRAST_PAIRS,
  FONT_REGISTRY,
  isHexColor,
  validateTheme,
} from '@/core/theme';
import { useTheme } from '@/app/providers/ThemeContext';
import { useLanguage } from '@/app/providers/LanguageContext';
import { useContainer } from '@/app/ContainerContext';
import { ThemePreviewCard } from '@/features/settings/ThemePreviewCard';
import { languageInfo } from '@/core/shared';
import { useCloseOnBack } from '@/shared/hooks/useCloseOnBack';
import { format, type BackofficeTexts } from '../i18n/backofficeTexts';
import { useBackofficeText } from '../i18n/useBackofficeText';

const colorLabels = (b: BackofficeTexts): Record<keyof ThemeColors, string> => ({
  brand: b.panColorBrand,
  brandStrong: b.panColorBrandStrong,
  brandText: b.panColorBrandText,
  onBrand: b.panColorOnBrand,
  accent: b.panColorAccent,
  accentStrong: b.panColorAccentStrong,
  accentText: b.panColorAccentText,
  onAccent: b.panColorOnAccent,
  highlight: b.panColorHighlight,
  surface: b.panColorSurface,
  card: b.panColorCard,
  line: b.panColorLine,
  ink: b.panColorInk,
  inkMuted: b.panColorInkMuted,
  heroFrom: b.panColorHeroFrom,
  heroTo: b.panColorHeroTo,
});

const shapeLabels = (b: BackofficeTexts): Record<CardShape, string> => ({
  rounded: b.panShapeRounded,
  arch: b.panShapeArch,
  square: b.panShapeSquare,
});
const patternLabels = (b: BackofficeTexts): Record<ThemePattern, string> => ({
  none: b.panPatternNone,
  zellige: b.panPatternZellige,
  dots: b.panPatternDots,
  waves: b.panPatternWaves,
});

interface ThemeEditorProps {
  onNotify: (message: string, isError?: boolean) => void;
}

function newThemeId() {
  return `theme_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export const ThemeEditor: React.FC<ThemeEditorProps> = ({ onNotify }) => {
  const { getThemeName } = useLanguage();
  const b = useBackofficeText();
  const COLOR_LABELS = colorLabels(b);
  const SHAPE_LABELS = shapeLabels(b);
  const PATTERN_LABELS = patternLabels(b);
  const { setPreviewTheme, isPreviewing, refreshThemes } = useTheme();
  const { themes: themeRepository } = useContainer();
  const [remoteThemes, setRemoteThemes] = useState<AppTheme[]>(() => themeRepository.cached());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [draft, setDraft] = useState<AppTheme | null>(null);
  const [colorMode, setColorMode] = useState<'light' | 'dark'>('light');

  const loadThemes = useCallback(async () => {
    setIsLoading(true);
    const list = await themeRepository.fetchAll();
    if (list) setRemoteThemes(list);
    setIsLoading(false);
  }, [themeRepository]);

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
    const result = await themeRepository.save(draft);
    setIsSaving(false);
    if (!result.ok) {
      onNotify(format(b.panThemeNotSaved, { error: result.error }), true);
      return;
    }
    onNotify(draft.is_published ? b.panThemeSavedPublished : b.panThemeSavedDraft);
    closeEditor();
    await loadThemes();
    await refreshThemes();
  };

  const togglePublish = async (theme: AppTheme) => {
    const result = await themeRepository.save({ ...theme, is_published: !theme.is_published });
    if (!result.ok) return onNotify(result.error, true);
    onNotify(theme.is_published ? b.panThemeUnpublished : b.panThemePublished);
    await loadThemes();
    await refreshThemes();
  };

  const handleDelete = async (theme: AppTheme) => {
    if (!window.confirm(format(b.panThemeDeleteConfirm, { name: getThemeName(theme) }))) return;
    const result = await themeRepository.remove(theme.id);
    if (!result.ok) return onNotify(result.error, true);
    onNotify(b.panThemeDeleted);
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
            {remoteThemes.some((t) => t.id === draft.id)
              ? format(b.panThemeEditTitle, { name: getThemeName(draft) })
              : b.panThemeNew}
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPreviewTheme(isPreviewing ? null : draft)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-line bg-card text-xs font-semibold text-ink hover:border-brand"
            >
              <FlaskConical className="w-4 h-4 text-accent-text" />
              {isPreviewing ? b.panStopPreview : b.panTryOnMe}
            </button>
            <button
              type="button"
              onClick={closeEditor}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-ink-muted hover:text-ink"
            >
              <X className="w-4 h-4" />
              {b.cancel}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || errors.length > 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-on-brand text-xs font-bold hover:bg-brand-strong disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {b.save}
            </button>
          </div>
        </div>

        {isPreviewing && <p className="text-xs text-accent-text font-semibold">{b.panPreviewActive}</p>}

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
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted">{b.panThemeName}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(
                  [
                    ['name_fr', languageInfo('fr').label],
                    ['name_derja', languageInfo('derja').label],
                    ['name_ar', languageInfo('ar').label],
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
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted">{b.panStyle}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="text-[11px] font-bold text-ink-muted">
                  {b.panTitleFont}
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
                  {b.panCardShape}
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
                  {b.panPattern}
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
                {b.panPublishForAll}
              </label>
            </section>

            {/* Colors */}
            <section className="p-4 rounded-2xl bg-card border border-line space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted">{b.panColors}</h4>
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
                      {m === 'light' ? b.panLightMode : b.panDarkMode}
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
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted">{b.panPreview}</h4>
              {errors.length === 0 ? (
                <>
                  <ThemePreviewCard theme={draft} name={getThemeName(draft)} dark={false} />
                  <ThemePreviewCard theme={draft} name={getThemeName(draft)} dark />
                </>
              ) : (
                <p className="text-xs text-ink-muted">{b.panFixErrorsForPreview}</p>
              )}
            </div>
            <div className="p-3 rounded-2xl bg-card border border-line space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                {colorMode === 'light' ? b.panReadabilityLight : b.panReadabilityDark}
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
              <p className="text-[10px] text-ink-muted">{b.panContrastHint}</p>
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
          <h3 className="font-display text-lg font-extrabold text-ink">{b.panThemesTitle}</h3>
          <p className="text-xs text-ink-muted">{b.panThemesIntro}</p>
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
                  {builtin ? b.panBuiltin : theme.is_published ? b.panPublished : b.panDraft}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startDuplicate(theme)}
                    title={b.panDuplicate}
                    aria-label={`${b.panDuplicate} ${getThemeName(theme)}`}
                    className="p-2 rounded-lg text-ink-muted hover:bg-brand/10 hover:text-brand-text"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  {!builtin && (
                    <>
                      <button
                        onClick={() => startEdit(theme)}
                        title={b.panEdit}
                        aria-label={`${b.panEdit} ${getThemeName(theme)}`}
                        className="p-2 rounded-lg text-ink-muted hover:bg-brand/10 hover:text-brand-text"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => togglePublish(theme)}
                        title={theme.is_published ? b.panUnpublish : b.panPublish}
                        aria-label={`${theme.is_published ? b.panUnpublish : b.panPublish} ${getThemeName(theme)}`}
                        className="p-2 rounded-lg text-ink-muted hover:bg-brand/10 hover:text-brand-text"
                      >
                        {theme.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(theme)}
                        title={b.panDelete}
                        aria-label={`${b.panDelete} ${getThemeName(theme)}`}
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
