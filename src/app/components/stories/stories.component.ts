import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoryStorageService } from '../../services/story-storage.service';
import { ProjectStorageService } from '../../services/project-storage.service';
import { UserService } from '../../services/user.service';
import { Story, StoryPriority, StoryStatus } from '../../models/story.model';

@Component({
  selector: 'app-stories',
  imports: [CommonModule, FormsModule],
  template: `
    @if (!projectStorage.activeProject()) {
      <div class="no-project">
        <p>Wybierz projekt, aby zobaczyć historyjki</p>
      </div>
    } @else {
      <div class="stories-container">
        <div class="form-card">
          <h2>{{ editingId() ? 'Edytuj historyjkę' : 'Dodaj nową historyjkę' }}</h2>
          <form (ngSubmit)="saveStory()">
            <div class="form-row">
              <div class="form-group">
                <label for="nazwa">Nazwa</label>
                <input
                  type="text"
                  id="nazwa"
                  [(ngModel)]="formData.nazwa"
                  name="nazwa"
                  required
                  placeholder="Wprowadź nazwę"
                />
              </div>

              <div class="form-group">
                <label for="priorytet">Priorytet</label>
                <select id="priorytet" [(ngModel)]="formData.priorytet" name="priorytet">
                  <option value="niski">Niski</option>
                  <option value="sredni">Średni</option>
                  <option value="wysoki">Wysoki</option>
                </select>
              </div>

              <div class="form-group">
                <label for="stan">Stan</label>
                <select id="stan" [(ngModel)]="formData.stan" name="stan">
                  <option value="todo">Do zrobienia</option>
                  <option value="doing">W trakcie</option>
                  <option value="done">Zrobione</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label for="opis">Opis</label>
              <textarea
                id="opis"
                [(ngModel)]="formData.opis"
                name="opis"
                rows="2"
                placeholder="Wprowadź opis"
              ></textarea>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-primary">
                {{ editingId() ? 'Zapisz' : 'Dodaj' }}
              </button>
              @if (editingId()) {
                <button type="button" class="btn-secondary" (click)="cancelEdit()">Anuluj</button>
              }
            </div>
          </form>
        </div>

        <div class="filter-tabs">
          <button [class.active]="activeFilter() === 'all'" (click)="setFilter('all')">
            Wszystkie ({{ filteredStories().length }})
          </button>
          <button [class.active]="activeFilter() === 'todo'" (click)="setFilter('todo')">
            Do zrobienia ({{ getTodoCount() }})
          </button>
          <button [class.active]="activeFilter() === 'doing'" (click)="setFilter('doing')">
            W trakcie ({{ getDoingCount() }})
          </button>
          <button [class.active]="activeFilter() === 'done'" (click)="setFilter('done')">
            Zrobione ({{ getDoneCount() }})
          </button>
        </div>

        <div class="stories-list">
          @if (filteredStories().length === 0) {
            <p class="empty-message">Brak historyjek do wyświetlenia</p>
          } @else {
            @for (story of filteredStories(); track story.id) {
              <div class="story-card" [class]="'priority-' + story.priorytet">
                <div class="story-header">
                  <h3>{{ story.nazwa }}</h3>
                  <span class="priority-badge" [class]="'priority-' + story.priorytet">
                    {{ getPriorityLabel(story.priorytet) }}
                  </span>
                </div>
                <p class="story-description">{{ story.opis || 'Brak opisu' }}</p>
                <div class="story-meta">
                  <span class="story-status" [class]="'status-' + story.stan">
                    {{ getStatusLabel(story.stan) }}
                  </span>
                  <span class="story-date">{{ story.dataUtworzenia | date: 'dd.MM.yyyy' }}</span>
                </div>
                <div class="story-actions">
                  <button class="btn-edit" (click)="editStory(story)">Edytuj</button>
                  <button class="btn-delete" (click)="deleteStory(story.id)">Usuń</button>
                </div>
              </div>
            }
          }
        </div>
      </div>
    }
  `,
  styles: [
    `
      .no-project {
        text-align: center;
        padding: 3rem;
        color: #666;
      }

      .stories-container {
        max-width: 900px;
        margin: 0 auto;
        padding: 2rem;
      }

      .form-card {
        background: #fff;
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        margin-bottom: 1.5rem;
      }

      h2 {
        margin-bottom: 1rem;
        color: #555;
        font-size: 1.25rem;
      }

      .form-row {
        display: flex;
        gap: 1rem;
      }

      .form-row .form-group {
        flex: 1;
      }

      .form-group {
        margin-bottom: 1rem;
      }

      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #444;
      }

      input,
      textarea,
      select {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
        font-family: inherit;
      }

      input:focus,
      textarea:focus,
      select:focus {
        outline: none;
        border-color: #007bff;
      }

      .form-actions {
        display: flex;
        gap: 1rem;
      }

      button {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 4px;
        font-size: 1rem;
        cursor: pointer;
        transition: background-color 0.2s;
      }

      .btn-primary {
        background: #007bff;
        color: white;
      }
      .btn-primary:hover {
        background: #0056b3;
      }

      .btn-secondary {
        background: #6c757d;
        color: white;
      }
      .btn-secondary:hover {
        background: #545b62;
      }

      .filter-tabs {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
      }

      .filter-tabs button {
        padding: 0.5rem 1rem;
        background: #e9ecef;
        color: #333;
      }

      .filter-tabs button.active {
        background: #007bff;
        color: white;
      }

      .stories-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .story-card {
        background: #fff;
        padding: 1.25rem;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        border-left: 4px solid #ddd;
      }

      .story-card.priority-niski {
        border-left-color: #28a745;
      }
      .story-card.priority-sredni {
        border-left-color: #ffc107;
      }
      .story-card.priority-wysoki {
        border-left-color: #dc3545;
      }

      .story-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
      }

      .story-header h3 {
        margin: 0;
        color: #333;
      }

      .priority-badge {
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
      }

      .priority-badge.priority-niski {
        background: #d4edda;
        color: #155724;
      }
      .priority-badge.priority-sredni {
        background: #fff3cd;
        color: #856404;
      }
      .priority-badge.priority-wysoki {
        background: #f8d7da;
        color: #721c24;
      }

      .story-description {
        color: #666;
        margin-bottom: 0.75rem;
      }

      .story-meta {
        display: flex;
        gap: 1rem;
        margin-bottom: 0.75rem;
        font-size: 0.875rem;
      }

      .story-status {
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-weight: 500;
      }

      .story-status.status-todo {
        background: #e9ecef;
        color: #495057;
      }
      .story-status.status-doing {
        background: #cce5ff;
        color: #004085;
      }
      .story-status.status-done {
        background: #d4edda;
        color: #155724;
      }

      .story-date {
        color: #666;
      }

      .story-actions {
        display: flex;
        gap: 0.5rem;
      }

      .btn-edit {
        background: #28a745;
        color: white;
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
      }
      .btn-edit:hover {
        background: #1e7e34;
      }

      .btn-delete {
        background: #dc3545;
        color: white;
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
      }
      .btn-delete:hover {
        background: #c82333;
      }

      .empty-message {
        color: #666;
        font-style: italic;
        text-align: center;
        padding: 2rem;
      }
    `,
  ],
})
export class StoriesComponent {
  storyStorage = inject(StoryStorageService);
  projectStorage = inject(ProjectStorageService);
  userService = inject(UserService);

  activeFilter = signal<StoryStatus | 'all'>('all');
  editingId = signal<string | null>(null);

  formData = {
    nazwa: '',
    opis: '',
    priorytet: 'sredni' as StoryPriority,
    stan: 'todo' as StoryStatus,
  };

  filteredStories = computed(() => {
    const projectId = this.projectStorage.activeProject()?.id;
    if (!projectId) return [];

    const stories = this.storyStorage.getByProjectId(projectId);
    const filter = this.activeFilter();

    if (filter === 'all') return stories;
    return stories.filter((s) => s.stan === filter);
  });

  getTodoCount(): number {
    const projectId = this.projectStorage.activeProject()?.id;
    return projectId ? this.storyStorage.getByProjectAndStatus(projectId, 'todo').length : 0;
  }

  getDoingCount(): number {
    const projectId = this.projectStorage.activeProject()?.id;
    return projectId ? this.storyStorage.getByProjectAndStatus(projectId, 'doing').length : 0;
  }

  getDoneCount(): number {
    const projectId = this.projectStorage.activeProject()?.id;
    return projectId ? this.storyStorage.getByProjectAndStatus(projectId, 'done').length : 0;
  }

  setFilter(filter: StoryStatus | 'all'): void {
    this.activeFilter.set(filter);
  }

  saveStory(): void {
    if (!this.formData.nazwa.trim()) return;

    const projectId = this.projectStorage.activeProject()?.id;
    if (!projectId) return;

    const id = this.editingId();
    if (id) {
      this.storyStorage.update(id, this.formData);
    } else {
      this.storyStorage.create({
        ...this.formData,
        projektId: projectId,
        wlascicielId: this.userService.currentUser().id,
      });
    }

    this.resetForm();
  }

  editStory(story: Story): void {
    this.editingId.set(story.id);
    this.formData = {
      nazwa: story.nazwa,
      opis: story.opis,
      priorytet: story.priorytet,
      stan: story.stan,
    };
  }

  deleteStory(id: string): void {
    if (confirm('Czy na pewno chcesz usunąć tę historyjkę?')) {
      this.storyStorage.delete(id);
      if (this.editingId() === id) {
        this.cancelEdit();
      }
    }
  }

  cancelEdit(): void {
    this.resetForm();
  }

  private resetForm(): void {
    this.editingId.set(null);
    this.formData = { nazwa: '', opis: '', priorytet: 'sredni', stan: 'todo' };
  }

  getPriorityLabel(priority: StoryPriority): string {
    const labels: Record<StoryPriority, string> = {
      niski: 'Niski',
      sredni: 'Średni',
      wysoki: 'Wysoki',
    };
    return labels[priority];
  }

  getStatusLabel(status: StoryStatus): string {
    const labels: Record<StoryStatus, string> = {
      todo: 'Do zrobienia',
      doing: 'W trakcie',
      done: 'Zrobione',
    };
    return labels[status];
  }
}
