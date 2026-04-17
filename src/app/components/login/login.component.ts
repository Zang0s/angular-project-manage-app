import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  PLATFORM_ID,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { NotificationService } from '../../services/notification.service';
import { GOOGLE_CLIENT_ID } from '../../app.settings';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (element: HTMLElement, config: Record<string, unknown>) => void;
          prompt: () => void;
        };
      };
    };
    __GOOGLE_CLIENT_ID__?: string;
  }
}

const PLACEHOLDER_CLIENT_ID = 'PUT_GOOGLE_CLIENT_ID_HERE';

function pickGoogleClientId(): string {
  const fromWindow = (
    globalThis as unknown as {
      __GOOGLE_CLIENT_ID__?: string;
    }
  ).__GOOGLE_CLIENT_ID__;

  const candidates = [fromWindow, GOOGLE_CLIENT_ID]
    .map((value) => (value || '').trim())
    .filter((value) => !!value && value !== PLACEHOLDER_CLIENT_ID);

  return candidates[0] || '';
}

const RESOLVED_GOOGLE_CLIENT_ID = pickGoogleClientId();

@Component({
  selector: 'app-login',
  imports: [CommonModule],
  template: `
    <section class="wrap">
      <div class="card">
        <h1>Logowanie</h1>
        <p>Zaloguj sie przez konto Google.</p>

        @if (error()) {
          <p class="error">{{ error() }}</p>
        }

        @if (isClientIdMissing()) {
          <p class="hint">
            Brak Google Client ID. Ustaw wartosc <code>GOOGLE_CLIENT_ID</code> w pliku
            <code>src/app/app.settings.ts</code> albo nadpisz przez
            <code>window.__GOOGLE_CLIENT_ID__</code> w <code>src/index.html</code>.
          </p>
        }

        <div #googleButton class="google-button-host"></div>

        <small>
          Nowe konto dostaje role <strong>guest</strong> (poza kontem super-admin) i widzi tylko
          ekran oczekiwania.
        </small>
      </div>
    </section>
  `,
  styles: [
    `
      .wrap {
        min-height: calc(100vh - 70px);
        display: grid;
        place-items: center;
        padding: 1rem;
      }

      .card {
        width: min(480px, 100%);
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 0.9rem;
        padding: 1.2rem;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
      }

      h1 {
        margin: 0;
      }

      p {
        margin: 0.45rem 0 1rem;
        color: #475569;
      }

      .google-button-host {
        min-height: 44px;
        margin: 0.25rem 0 0.8rem;
      }

      .error {
        color: #b91c1c;
      }

      .hint {
        color: #92400e;
        background: #fef3c7;
        border: 1px solid #fcd34d;
        border-radius: 0.55rem;
        padding: 0.5rem;
      }

      small {
        color: #6b7280;
      }

      :host-context(html.dark) .card {
        background: #1e293b;
        border-color: #334155;
      }

      :host-context(html.dark) p,
      :host-context(html.dark) small {
        color: #cbd5e1;
      }
    `,
  ],
})
export class LoginComponent implements AfterViewInit {
  @ViewChild('googleButton', { static: true }) googleButtonRef!: ElementRef<HTMLElement>;

  private readonly isBrowser: boolean;
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);
  private notificationService = inject(NotificationService);

  error = signal<string | null>(null);

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  async ngAfterViewInit(): Promise<void> {
    if (!this.isBrowser) return;

    if (this.isClientIdMissing()) {
      this.error.set('Brak konfiguracji OAuth Google.');
      return;
    }

    try {
      await this.loadGoogleScript();
      this.initGoogleAuth();
    } catch {
      this.error.set('Nie udalo sie zaladowac Google OAuth.');
    }
  }

  isClientIdMissing(): boolean {
    return !RESOLVED_GOOGLE_CLIENT_ID;
  }

  private initGoogleAuth(): void {
    if (!window.google?.accounts?.id) {
      this.error.set('Google OAuth jest niedostepne.');
      return;
    }

    window.google.accounts.id.initialize({
      client_id: RESOLVED_GOOGLE_CLIENT_ID,
      callback: ({ credential }) => this.handleCredential(credential),
    });

    window.google.accounts.id.renderButton(this.googleButtonRef.nativeElement, {
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'pill',
      width: 320,
    });
  }

  private handleCredential(credential: string): void {
    try {
      const result = this.userService.loginWithGoogleCredential(credential);

      if (result.isNewUser) {
        const admins = this.userService.getByRole('admin');
        this.notificationService.sendMany(
          admins.map((admin) => ({
            title: 'Nowe konto w systemie',
            message: `Uzytkownik ${result.user.imie} ${result.user.nazwisko} (${result.user.email}) zalogowal sie po raz pierwszy.`,
            priority: 'high' as const,
            recipientId: admin.id,
          })),
        );
      }

      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      if (result.user.isBlocked) {
        this.router.navigate(['/blocked']);
        return;
      }

      if (result.user.rola === 'guest') {
        this.router.navigate(['/pending-approval']);
        return;
      }

      if (returnUrl) {
        this.router.navigateByUrl(returnUrl);
      } else {
        this.router.navigate(['/']);
      }
    } catch (e) {
      this.error.set('Logowanie nie powiodlo sie.');
    }
  }

  private loadGoogleScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }

      const existing = document.querySelector<HTMLScriptElement>('script[data-google-gsi="1"]');
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.dataset['googleGsi'] = '1';
      script.onload = () => resolve();
      script.onerror = () => reject();
      document.head.appendChild(script);
    });
  }
}
