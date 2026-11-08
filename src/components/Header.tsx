import React, { useState } from 'react';
import { Palette, Globe, User, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Language } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { User as FirebaseUser } from 'firebase/auth';

interface HeaderProps {
  activeTab: 'home' | 'fridge' | 'recipes' | 'weekly' | 'grocery' | 'backoffice';
  setActiveTab: (tab: 'home' | 'fridge' | 'recipes' | 'weekly' | 'grocery' | 'backoffice') => void;
  currentUser: FirebaseUser | null;
  onOpenUserModal: () => void;
  isPatronAuthenticated: boolean;
  onOpenPatronModal: () => void;
  onPatronLogout: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenUserModal,
  isPatronAuthenticated,
  onOpenPatronModal,
  onPatronLogout,
  onOpenSettings,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [logoClicks, setLogoClicks] = useState(0);

  const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as Language);
  };

  const handleLogoClick = () => {
    const next = logoClicks + 1;
    setLogoClicks(next);
    if (next >= 3) {
      setLogoClicks(0);
      onOpenPatronModal();
    } else {
      setActiveTab('home');
      setTimeout(() => setLogoClicks(0), 3000);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-surface/90 backdrop-blur-md border-b border-line transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Brand Wordmark (with discrete 3-clicks patron trigger) */}
        <button
          onClick={handleLogoClick}
          title="Chnowa Ntayeb (3 clics pour l'accès patron)"
          className="flex items-center gap-2.5 text-left group shrink-0"
        >
          <img
            src="/mark.png"
            alt=""
            width={94}
            height={40}
            className="h-10 w-auto shrink-0 drop-shadow-sm group-hover:scale-105 transition-transform"
          />
          <div className="flex flex-col">
            <span className="font-display text-lg sm:text-xl font-extrabold tracking-tight text-ink whitespace-nowrap">
              Chnowa Ntayeb
            </span>
            <span className="text-[10px] text-accent-text font-bold tracking-wide -mt-0.5 whitespace-nowrap">
              <span className="hidden sm:inline">شنوة نطيب؟ · </span>by Chef Souhed
            </span>
          </div>
        </button>

        {/* Zone 2: Public Navigation Links (Backoffice strictly removed) */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
          <button
            onClick={() => setActiveTab('fridge')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'fridge'
                ? 'text-brand-text font-bold border-b-2 border-brand-text'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t.navFridge}
          </button>
          <button
            onClick={() => setActiveTab('recipes')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'recipes'
                ? 'text-brand-text font-bold border-b-2 border-brand-text'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t.navRecipes}
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'weekly'
                ? 'text-brand-text font-bold border-b-2 border-brand-text'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t.navWeekly}
          </button>
          <button
            onClick={() => setActiveTab('grocery')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'grocery'
                ? 'text-brand-text font-bold border-b-2 border-brand-text'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t.navGrocery}
          </button>
        </nav>

        {/* Zone 3: Actions & Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Secret Patron Badge when authenticated */}
          {isPatronAuthenticated && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveTab('backoffice')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition shadow-xs ${
                  activeTab === 'backoffice'
                    ? 'bg-accent text-on-accent'
                    : 'bg-accent/10 text-accent-text dark:bg-accent/20 hover:bg-accent hover:text-on-accent'
                }`}
                title="Accéder au Backoffice Patron"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Patron</span>
              </button>
              <button
                onClick={onPatronLogout}
                className="text-[11px] text-slate-400 hover:text-rose-500 font-semibold px-1"
                title="Déconnexion Patron"
              >
                Quitter
              </button>
            </div>
          )}

          {/* User Account / Profile Button */}
          <button
            onClick={onOpenUserModal}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition border ${
              currentUser
                ? 'bg-brand/10 border-brand/30 text-brand-text'
                : 'bg-card border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-300'
            }`}
            title={currentUser ? 'Mon Compte' : 'Se connecter'}
          >
            <User className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">
              {currentUser ? (currentUser.isAnonymous ? 'Invité' : (currentUser.email?.split('@')[0] || 'Compte')) : 'Compte'}
            </span>
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton variant="header" />

          {/* Language Selector (desktop; also available in Settings) */}
          <div className="relative hidden sm:inline-flex items-center">
            <Globe className="w-3.5 h-3.5 absolute left-2 pointer-events-none text-slate-500" />
            <select
              value={language}
              onChange={handleLangChange}
              aria-label="Sélectionner la langue"
              className="appearance-none pl-7 pr-3.5 py-1.5 text-xs font-semibold rounded-lg bg-card border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand cursor-pointer"
            >
              <option value="derja">🇹🇳 Derja</option>
              <option value="fr">🇫🇷 FR</option>
              <option value="ar">العربية</option>
            </select>
          </div>

          {/* Settings (theme, mode, language) */}
          <button
            onClick={onOpenSettings}
            aria-label={t.settingsTitle}
            title={t.settingsTitle}
            className="p-2 rounded-lg text-ink-muted hover:text-brand-text hover:bg-brand/10 transition-colors"
          >
            <Palette className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="pattern-band" aria-hidden="true" />
    </header>
  );
};

