import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UserService } from '../../services/user.service';
import { ProjectStorageService } from '../../services/project-storage.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  template: `
    <header class="header">
      <nav class="nav-left">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }"
          >Historyjki</a
        >
        <a routerLink="/tasks" routerLinkActive="active">Zadania</a>
        <a routerLink="/kanban" routerLinkActive="active">Kanban</a>
        <a routerLink="/projects" routerLinkActive="active">Projekty</a>
      </nav>

      <div class="header-center">
        <div class="project-selector">
          <label for="project-select">Projekt:</label>
          <select
            id="project-select"
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

      <div class="user-info">
        <span class="user-label">Zalogowany:</span>
        <span class="user-name"
          >{{ userService.currentUser().imie }} {{ userService.currentUser().nazwisko }}</span
        >
        <span class="role-badge role-{{ userService.currentUser().rola }}">{{
          getRoleLabel(userService.currentUser().rola)
        }}</span>
      </div>
    </header>
  `,
  styles: [
    `
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 2rem;
        background: #fff;
        border-bottom: 1px solid #ddd;
        gap: 2rem;
      }

      .nav-left {
        display: flex;
        gap: 0.5rem;
      }

      .nav-left a {
        padding: 0.5rem 1rem;
        text-decoration: none;
        color: #333;
        border-radius: 4px;
        transition: background-color 0.2s;
      }

      .nav-left a:hover {
        background: #e9ecef;
      }

      .nav-left a.active {
        background: #007bff;
        color: white;
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

      .project-selector label {
        color: #666;
        white-space: nowrap;
      }

      .project-selector select {
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
        min-width: 200px;
        cursor: pointer;
      }

      .project-selector select:focus {
        outline: none;
        border-color: #007bff;
      }

      .user-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .user-label {
        color: #666;
      }

      .user-name {
        font-weight: 600;
        color: #333;
      }

      .role-badge {
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
      }

      .role-badge.role-admin {
        background: #e9ecef;
        color: #495057;
      }
      .role-badge.role-devops {
        background: #cce5ff;
        color: #004085;
      }
      .role-badge.role-developer {
        background: #d4edda;
        color: #155724;
      }
    `,
  ],
})
export class HeaderComponent {
  userService = inject(UserService);
  projectStorage = inject(ProjectStorageService);

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
}
