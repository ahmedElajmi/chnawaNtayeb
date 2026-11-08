import React, { useEffect } from 'react';
import { Check } from 'lucide-react';
import { AppTheme } from '../types';
import { FONT_REGISTRY } from '../services/themeValidation';
import { ensureFontLoaded } from '../context/ThemeContext';

interface ThemePreviewCardProps {
  theme: AppTheme;
  name: string;
  dark: boolean;
  isActive?: boolean;
  activeLabel?: string;
  onSelect?: () => void;
}

/**
 * Miniature of the app rendered with the theme's own colors (inline styles,
 * independent from the theme currently applied to the page).
 */
export const ThemePreviewCard: React.FC<ThemePreviewCardProps> = ({
  theme,
  name,
  dark,
  isActive,
  activeLabel,
  onSelect,
}) => {
  const c = dark ? theme.dark : theme.light;
  const font = FONT_REGISTRY[theme.displayFont] ?? FONT_REGISTRY['plus-jakarta'];

  useEffect(() => {
    ensureFontLoaded(font.href);
  }, [font.href]);

  const mediaRadius =
    theme.cardShape === 'arch' ? '999px 999px 6px 6px' : theme.cardShape === 'square' ? '3px' : '8px';
  const cardRadius = theme.cardShape === 'square' ? '4px' : '12px';

  const Wrapper: React.ElementType = onSelect ? 'button' : 'div';

  return (
    <Wrapper
      type={onSelect ? 'button' : undefined}
      onClick={onSelect}
      aria-pressed={onSelect ? !!isActive : undefined}
      className={`relative w-full text-left rounded-2xl p-1 transition ${
        isActive ? 'ring-2 ring-brand ring-offset-2 ring-offset-card' : 'hover:ring-1 hover:ring-line'
      }`}
    >
      <div
        className="rounded-xl p-3 border"
        style={{ background: c.surface, borderColor: c.line, color: c.ink }}
      >
        <div className="flex items-center justify-between mb-2">
          <span style={{ fontFamily: font.family, color: c.brandText }} className="text-sm font-extrabold truncate">
            {name}
          </span>
          {isActive && (
            <span
              className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: c.brand, color: c.onBrand }}
            >
              <Check className="w-3 h-3" />
              {activeLabel}
            </span>
          )}
        </div>

        <div
          className="overflow-hidden border"
          style={{ background: c.card, borderColor: c.line, borderRadius: cardRadius }}
        >
          <div
            style={{
              background: `linear-gradient(135deg, ${c.heroFrom}, ${c.heroTo})`,
              borderRadius: mediaRadius,
              margin: theme.cardShape === 'arch' ? '4px 4px 0' : 0,
            }}
            className="h-10"
          />
          <div className="p-2 space-y-1">
            <div className="h-1.5 w-3/4 rounded" style={{ background: c.ink, opacity: 0.85 }} />
            <div className="h-1.5 w-1/2 rounded" style={{ background: c.inkMuted, opacity: 0.6 }} />
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-2">
          {[c.brand, c.accent, c.highlight, c.card, c.surface].map((color, i) => (
            <span
              key={i}
              className="w-4 h-4 rounded-full border"
              style={{ background: color, borderColor: c.line }}
            />
          ))}
          <span
            className="ml-auto text-[10px] font-bold px-2 py-1 rounded-md"
            style={{ background: c.accent, color: c.onAccent }}
          >
            Aa
          </span>
        </div>
      </div>
    </Wrapper>
  );
};
