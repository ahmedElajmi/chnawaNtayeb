import { useSyncExternalStore } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

/** Already installed, or launched from the home screen */
const isStandaloneMode = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (window.navigator as unknown as { standalone?: boolean }).standalone === true;

const isIOSDevice = () => /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());

/*
 * One shared install state for the whole app. The browser fires `beforeinstallprompt` once, at page
 * load: listening here (module level) lets a component mounted later (banner, Settings) still use it.
 * The service worker is registered once, in main.tsx (versioned URL, production only).
 */
type InstallState = { deferredPrompt: BeforeInstallPromptEvent | null; isInstalled: boolean };
let state: InstallState = { deferredPrompt: null, isInstalled: isStandaloneMode() };
const listeners = new Set<() => void>();
const update = (patch: Partial<InstallState>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  update({ deferredPrompt: e as BeforeInstallPromptEvent });
});
window.addEventListener('appinstalled', () => update({ isInstalled: true, deferredPrompt: null }));

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const isIOS = isIOSDevice();

export function usePWAInstall() {
  const { deferredPrompt, isInstalled } = useSyncExternalStore(subscribe, () => state);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      update({ isInstalled: true, deferredPrompt: null });
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    install,
  };
}
