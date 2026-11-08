import React from 'react';
import { NavLink, useMatch } from 'react-router';
import { Home, Refrigerator, UtensilsCrossed, CalendarDays, ShoppingBag } from 'lucide-react';
import { useLanguage } from '@/app/providers/LanguageContext';
import { PATHS } from '@/shared/paths';
import { useRecipesHref } from '@/features/recipes/filterMemory';
import { useGoHome } from '@/app/homeNavigation';

interface BottomNavProps {
  fridgeCount: number;
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  /** Also shown as active on another screen (the recipes tab on the suggestions) */
  alsoActive?: boolean;
}

/** Mobile tab bar: one link per screen. */
export const BottomNav: React.FC<BottomNavProps> = ({ fridgeCount }) => {
  const { t } = useLanguage();
  const recipesHref = useRecipesHref();
  const onSuggestions = useMatch(PATHS.suggestions) !== null;
  const goHome = useGoHome();

  const navItems: NavItem[] = [
    { to: PATHS.home, label: t.navHome, icon: Home },
    { to: PATHS.fridge, label: t.navFridge, icon: Refrigerator, badge: fridgeCount > 0 ? fridgeCount : undefined },
    { to: recipesHref(), label: t.navRecipes, icon: UtensilsCrossed, alsoActive: onSuggestions },
    { to: PATHS.planner, label: t.navWeekly, icon: CalendarDays },
    { to: PATHS.grocery, label: t.navGrocery, icon: ShoppingBag },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-line pb-safe shadow-lg">
      <div className="grid grid-cols-5 h-16 items-center px-1">
        {navItems.map(({ to, label, icon: Icon, badge, alsoActive }) => (
          <NavLink
            key={to}
            to={to}
            end={to === PATHS.home}
            onClick={(e) => {
              if (to !== PATHS.home) return;
              e.preventDefault();
              goHome();
            }}
            className={({ isActive: linkActive }) =>
              `flex flex-col items-center justify-center h-full min-h-[44px] transition-colors relative py-1 ${
                linkActive || alsoActive
                  ? 'text-brand-text font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`
            }
          >
            {({ isActive: linkActive }) => {
              const isActive = linkActive || alsoActive;
              return (
                <>
                  <div className="relative">
                    <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
                    {badge !== undefined && (
                      <span className="absolute -top-1.5 -right-2 bg-accent text-on-accent text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
                        {badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] tracking-tight mt-1 truncate max-w-[62px]">{label}</span>
                  {isActive && <div className="absolute bottom-1 w-6 h-0.5 rounded-full bg-brand" />}
                </>
              );
            }}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
