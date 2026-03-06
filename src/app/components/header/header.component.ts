import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { ProjectStorageService } from '../../services/project-storage.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, FormsModule],
  template: `
    <header class="header">
      <div class="user-info">
        <span class="user-label">Zalogowany:</span>
        <span class="user-name"
          >{{ userService.currentUser().imie }} {{ userService.currentUser().nazwisko }}</span
        >
      </div>

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
    </header>
  `,
  styles: [
    `
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 2rem;
        background: #fff;
        border-bottom: 1px solid #ddd;
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

      .project-selector {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .project-selector label {
        color: #666;
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
    `,
  ],
})
export class HeaderComponent {
  userService = inject(UserService);
  projectStorage = inject(ProjectStorageService);

  onProjectChange(projectId: string | null): void {
    this.projectStorage.setActiveProject(projectId);
  }
}
