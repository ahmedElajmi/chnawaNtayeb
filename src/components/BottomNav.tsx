import React from 'react';
import { Home, Refrigerator, UtensilsCrossed, CalendarDays, ShoppingBag } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface BottomNavProps {
  activeTab: 'home' | 'fridge' | 'recipes' | 'weekly' | 'grocery' | 'backoffice';
  setActiveTab: (tab: 'home' | 'fridge' | 'recipes' | 'weekly' | 'grocery' | 'backoffice') => void;
  fridgeCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, fridgeCount }) => {
  const { t } = useLanguage();

  interface NavItem {
    id: 'home' | 'fridge' | 'recipes' | 'weekly' | 'grocery';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }

  const navItems: NavItem[] = [
    { id: 'home', label: t.navHome, icon: Home },
    { id: 'fridge', label: t.navFridge, icon: Refrigerator, badge: fridgeCount > 0 ? fridgeCount : undefined },
    { id: 'recipes', label: t.navRecipes, icon: UtensilsCrossed },
    { id: 'weekly', label: t.navWeekly, icon: CalendarDays },
    { id: 'grocery', label: t.navGrocery, icon: ShoppingBag },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-line pb-safe shadow-lg">
      <div className="grid grid-cols-5 h-16 items-center px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors relative py-1 ${
                isActive
                  ? 'text-brand-text font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 bg-accent text-on-accent text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-1 truncate max-w-[62px]">
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-1 w-6 h-0.5 rounded-full bg-brand" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
