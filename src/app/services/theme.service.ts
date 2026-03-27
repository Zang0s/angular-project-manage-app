import { Injectable, signal, effect, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark' | 'system';

const THEME_KEY = 'manageme_theme';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private themeSignal = signal<Theme>('system');

  readonly theme = this.themeSignal.asReadonly();
  readonly isDark = signal<boolean>(false);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeTheme();

      effect(() => {
        const theme = this.themeSignal();
        this.applyTheme(theme);
        try {
          localStorage.setItem(THEME_KEY, theme);
        } catch (e) {}
      });
    }
  }

  private initializeTheme(): void {
    try {
      const saved = localStorage.getItem(THEME_KEY) as Theme | null;
      if (saved) {
        this.themeSignal.set(saved);
        return;
      }
    } catch (e) {}

    if (window.matchMedia) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.themeSignal.set(prefersDark ? 'dark' : 'light');
    }
  }

  private applyTheme(theme: Theme): void {
    const prefersDark =
      theme === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : theme === 'dark';

    this.isDark.set(prefersDark);

    if (prefersDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  toggle(): void {
    const current = this.themeSignal();
    if (current === 'light') {
      this.themeSignal.set('dark');
    } else if (current === 'dark') {
      this.themeSignal.set('system');
    } else {
      this.themeSignal.set('light');
    }
  }

  setTheme(theme: Theme): void {
    this.themeSignal.set(theme);
  }
}
