import { useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { ChevronDown, Cloud, CloudOff, LogOut, Menu, X } from 'lucide-react';
import { useCatalog, usePatron } from '@/app/ContainerContext';
import { PATHS, patronPath } from '@/shared/paths';
import { ModalShell } from '@/shared/ui/ModalShell';
import { useCloseOnBack } from '@/shared/hooks/useCloseOnBack';
import { useBackofficeText } from '../i18n/useBackofficeText';
import { BACKOFFICE_SECTIONS, sectionOf, type BackofficeSection, type SectionCounts } from './sections';

/** Whether the patron's changes reach every device, with the explanation on demand. */
function StatusPill() {
  const b = useBackofficeText();
  const { cloudStatus } = usePatron();
  const [open, setOpen] = useState(false);
  const online = cloudStatus === 'connected';
  const Icon = online ? Cloud : CloudOff;
  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition ${
          online
            ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200'
            : 'border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200'
        }`}
      >
        <Icon className="w-3.5 h-3.5" />
        {online ? b.statusOnline : b.statusLocal}
        <ChevronDown className={`w-3 h-3 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <p className="text-[11px] leading-relaxed text-ink-muted">
          {online ? b.statusOnlineDetail : b.statusLocalDetail}
        </p>
      )}
    </div>
  );
}

function Count({ value }: { value: number | null | undefined }) {
  if (value == null) return null;
  return <span className="ms-auto text-[10px] font-bold text-ink-muted tabular-nums">{value}</span>;
}

/**
 * Menu entries (sidebar on a computer, sheet on a phone). From the sheet, the page replaces the
 * sheet's own history entry, so "back" then returns to the previous page, not to the menu.
 */
function SectionLinks({ counts, onNavigate }: { counts: SectionCounts; onNavigate?: () => void }) {
  const b = useBackofficeText();
  return (
    <ul className="space-y-0.5">
      {BACKOFFICE_SECTIONS.map((s) => {
        const Icon = s.icon;
        return (
          <li key={s.page}>
            <NavLink
              to={patronPath(s.page)}
              end={s.page === ''}
              replace={Boolean(onNavigate)}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition ${
                  isActive ? 'bg-brand text-on-brand' : 'text-ink hover:bg-surface'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{s.label(b)}</span>
                  {isActive ? null : <Count value={s.count?.(counts)} />}
                </>
              )}
            </NavLink>
          </li>
        );
      })}
    </ul>
  );
}

/** Tabs of the sub-pages of a section (engine), each with its own address. */
function SubPageTabs({ section }: { section: BackofficeSection }) {
  const b = useBackofficeText();
  if (!section.subPages) return null;
  return (
    <nav
      aria-label={section.label(b)}
      className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-x-auto"
    >
      {section.subPages.map((sub) => (
        <NavLink
          key={sub.page}
          to={patronPath(section.page, sub.page)}
          className={({ isActive }) =>
            `px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              isActive ? 'bg-card text-ink shadow-xs' : 'text-ink-muted hover:text-ink'
            }`
          }
        >
          {sub.label(b)}
        </NavLink>
      ))}
    </nav>
  );
}

/** Content of a section with sub-pages: its shared frame, the sub-page tabs, then the sub-page. */
const NoFrame = ({ children }: { children: ReactNode }) => <>{children}</>;

export function SubPagesOutlet({ section }: { section: BackofficeSection }) {
  const Frame = section.frame ?? NoFrame;
  return (
    <Frame>
      <SubPageTabs section={section} />
      <Outlet />
    </Frame>
  );
}

/**
 * Frame of every backoffice page: a sidebar on a computer, a compact bar with a menu on a phone,
 * the connection status as a small pill, then the page title and the page.
 */
export function BackofficeLayout({ onLogout }: { onLogout: () => void }) {
  const b = useBackofficeText();
  const { pathname } = useLocation();
  const { recipes, ingredients } = useCatalog();
  const { cloudStatus } = usePatron();
  const [menuOpen, setMenuOpen] = useState(false);
  useCloseOnBack(menuOpen, () => setMenuOpen(false));

  const section = sectionOf(pathname);
  const counts: SectionCounts = { recipes: recipes.length, ingredients: ingredients.length };
  const Icon = section.icon;
  const logout = (
    <button
      type="button"
      onClick={onLogout}
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
    >
      <LogOut className="w-4 h-4" />
      {b.logout}
    </button>
  );

  return (
    <div className="lg:grid lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:gap-6 text-ink">
      <aside className="hidden lg:block">
        <nav aria-label={b.navLabel} className="sticky top-22 p-3 rounded-2xl bg-card border border-line space-y-3">
          <p className="px-3 pt-1 text-xs font-black uppercase tracking-wider text-ink-muted">{b.title}</p>
          <SectionLinks counts={counts} />
          <div className="px-3 pt-3 border-t border-line">
            <StatusPill />
          </div>
          {logout}
        </nav>
      </aside>

      <div className="min-w-0 space-y-4">
        {/* Phone and tablet: one compact bar instead of the sidebar */}
        <div className="lg:hidden sticky top-16 z-30 -mt-6 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2 bg-surface/95 backdrop-blur-md border-b border-line">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-haspopup="dialog"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-line text-sm font-bold"
          >
            <Menu className="w-4 h-4 shrink-0" />
            <Icon className="w-4 h-4 shrink-0 text-brand-text" />
            <span className="truncate">{section.label(b)}</span>
            <span
              aria-label={cloudStatus === 'connected' ? b.statusOnline : b.statusLocal}
              title={cloudStatus === 'connected' ? b.statusOnline : b.statusLocal}
              className={`ms-auto w-2.5 h-2.5 rounded-full shrink-0 ${
                cloudStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </button>
        </div>

        <header>
          <h1 className="text-lg sm:text-xl font-extrabold text-ink flex items-center gap-2">
            <Icon className="hidden lg:block w-5 h-5 text-brand-text" />
            {section.label(b)}
          </h1>
          <p className="text-xs text-ink-muted mt-0.5">{section.hint(b)}</p>
        </header>

        <Outlet />
      </div>

      {menuOpen && (
        <ModalShell onDismiss={() => setMenuOpen(false)} mobile="bottom">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={b.menu}
            className="w-full sm:max-w-sm bg-card rounded-t-3xl sm:rounded-3xl p-4 space-y-3 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-wider text-ink-muted">{b.title}</p>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label={b.closeMenu}
                className="p-1.5 rounded-lg hover:bg-surface"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav aria-label={b.navLabel}>
              <SectionLinks counts={counts} onNavigate={() => setMenuOpen(false)} />
            </nav>
            <div className="px-3 pt-3 border-t border-line">
              <StatusPill />
            </div>
            {logout}
            <Link
              to={PATHS.home}
              replace
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-1 text-xs font-semibold text-ink-muted hover:text-ink"
            >
              {b.backToSite}
            </Link>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
