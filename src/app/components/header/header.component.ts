import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UserService } from '../../services/user.service';
import { ProjectStorageService } from '../../services/project-storage.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  template: `
    <header class="header">
      <nav class="nav-left">
        <a
          routerLink="/"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: true }"
          class="nav-link"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="icon"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path
              fill-rule="evenodd"
              d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
              clip-rule="evenodd"
            />
          </svg>
          <span>Historyjki</span>
        </a>
        <a routerLink="/tasks" routerLinkActive="active" class="nav-link">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="icon"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path
              fill-rule="evenodd"
              d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z"
              clip-rule="evenodd"
            />
          </svg>
          <span>Zadania</span>
        </a>
        <a routerLink="/kanban" routerLinkActive="active" class="nav-link">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="icon"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              d="M2 4a1 1 0 011-1h4a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V4zm6 0a1 1 0 011-1h4a1 1 0 011 1v12a1 1 0 01-1 1H9a1 1 0 01-1-1V4z"
            />
          </svg>
          <span>Kanban</span>
        </a>
        <a routerLink="/projects" routerLinkActive="active" class="nav-link">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="icon"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
          </svg>
          <span>Projekty</span>
        </a>
      </nav>

      <div class="header-center">
        <div class="project-selector">
          <label for="project-select" class="selector-label">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="icon-sm"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                clip-rule="evenodd"
              />
            </svg>
            Projekt:
          </label>
          <select
            id="project-select"
            class="project-select"
            [ngModel]="projectStorage.activeProjectId()"
            (ngModelChange)="onProjectChange($event)"
          >
            <option [ngValue]="null">Wybierz projekt...</option>
            @for (project of projectStorage.projects(); track project.id) {
              <option [ngValue]="project.id">{{ project.nazwa }}</option>
            }
          </select>
        </div>
      </div>

      <div class="header-right">
        <button class="theme-toggle" (click)="themeService.toggle()" [title]="getThemeLabel()">
          @if (themeService.isDark()) {
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="icon"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          } @else {
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="icon"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                clip-rule="evenodd"
              />
            </svg>
          }
        </button>

        <div class="user-info">
          <div class="user-avatar">
            {{ userService.currentUser().imie[0] }}{{ userService.currentUser().nazwisko[0] }}
          </div>
          <div class="user-details">
            <span class="user-name"
              >{{ userService.currentUser().imie }} {{ userService.currentUser().nazwisko }}</span
            >
            <span class="role-badge role-{{ userService.currentUser().rola }}">{{
              getRoleLabel(userService.currentUser().rola)
            }}</span>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem 1.5rem;
        background: #ffffff;
        border-bottom: 1px solid #e5e7eb;
        gap: 1rem;
      }

      :host-context(html.dark) .header {
        background: #1f2937;
        border-color: #374151;
      }

      .nav-left {
        display: flex;
        gap: 0.25rem;
      }

      .nav-link {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        border-radius: 0.5rem;
        color: #374151;
        text-decoration: none;
        transition: background-color 0.2s;
      }

      :host-context(html.dark) .nav-link {
        color: #d1d5db;
      }

      .nav-link:hover {
        background: #f3f4f6;
      }

      :global(html.dark) .nav-link:hover {
        background: #374151;
      }

      .nav-link.active {
        background: #2563eb;
        color: white;
      }

      .nav-link.active:hover {
        background: #1d4ed8;
      }

      .icon {
        width: 1.25rem;
        height: 1.25rem;
      }

      .icon-sm {
        width: 1rem;
        height: 1rem;
      }

      .header-center {
        flex: 1;
        display: flex;
        justify-content: center;
      }

      .project-selector {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .selector-label {
        color: #6b7280;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }

      :global(html.dark) .selector-label {
        color: #9ca3af;
      }

      .project-select {
        padding: 0.5rem 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 0.5rem;
        font-size: 0.875rem;
        min-width: 12rem;
        cursor: pointer;
        background: white;
      }

      :global(html.dark) .project-select {
        background: #374151;
        border-color: #4b5563;
        color: #f3f4f6;
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .theme-toggle {
        padding: 0.5rem;
        border-radius: 0.5rem;
        background: transparent;
        border: none;
        cursor: pointer;
        color: #6b7280;
        transition: background-color 0.2s;
      }

      :global(html.dark) .theme-toggle {
        color: #d1d5db;
      }

      .theme-toggle:hover {
        background: #f3f4f6;
      }

      :global(html.dark) .theme-toggle:hover {
        background: #374151;
      }

      .user-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .user-avatar {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 9999px;
        background: #2563eb;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 0.875rem;
      }

      .user-details {
        display: flex;
        flex-direction: column;
      }

      .user-name {
        font-weight: 600;
        color: #111827;
        font-size: 0.875rem;
      }

      :global(html.dark) .user-name {
        color: #f3f4f6;
      }

      .role-badge {
        font-size: 0.75rem;
        padding: 0.125rem 0.5rem;
        border-radius: 9999px;
        font-weight: 500;
      }

      .role-badge.role-admin {
        background: #e5e7eb;
        color: #374151;
      }
      :global(html.dark) .role-badge.role-admin {
        background: #4b5563;
        color: #d1d5db;
      }

      .role-badge.role-devops {
        background: #dbeafe;
        color: #1d4ed8;
      }
      :global(html.dark) .role-badge.role-devops {
        background: #1e3a8a;
        color: #93c5fd;
      }

      .role-badge.role-developer {
        background: #d1fae5;
        color: #047857;
      }
      :global(html.dark) .role-badge.role-developer {
        background: #064e3b;
        color: #6ee7b7;
      }

      @media (max-width: 768px) {
        .nav-link span {
          display: none;
        }
        .user-details {
          display: none;
        }
        .selector-label {
          display: none;
        }
      }
    `,
  ],
})
export class HeaderComponent {
  userService = inject(UserService);
  projectStorage = inject(ProjectStorageService);
  themeService = inject(ThemeService);

  onProjectChange(projectId: string | null): void {
    this.projectStorage.setActiveProject(projectId);
  }

  getRoleLabel(rola: string): string {
    const labels: Record<string, string> = {
      admin: 'Admin',
      devops: 'DevOps',
      developer: 'Developer',
    };
    return labels[rola] || rola;
  }

  getThemeLabel(): string {
    const labels: Record<string, string> = {
      light: 'Tryb jasny',
      dark: 'Tryb ciemny',
      system: 'Zgodnie z systemem',
    };
    return labels[this.themeService.theme()];
  }
}
