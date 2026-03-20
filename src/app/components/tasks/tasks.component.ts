import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TaskStorageService } from '../../services/task-storage.service';
import { ProjectStorageService } from '../../services/project-storage.service';
import { StoryStorageService } from '../../services/story-storage.service';
import { UserService } from '../../services/user.service';
import { Task, TaskPriority, TaskStatus } from '../../models/task.model';

@Component({
  selector: 'app-tasks',
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    @if (!projectStorage.activeProject()) {
      <div class="no-project">
        <p>Wybierz projekt, aby zobaczyć zadania</p>
      </div>
    } @else {
      <div class="tasks-container">
        <div class="form-card">
          <h2>{{ editingId() ? 'Edytuj zadanie' : 'Dodaj nowe zadanie' }}</h2>
          <form (ngSubmit)="saveTask()">
            <div class="form-row">
              <div class="form-group">
                <label for="story">Historyjka</label>
                <select
                  id="story"
                  [(ngModel)]="formData.storyId"
                  name="storyId"
                  required
                  [disabled]="!!editingId()"
                >
                  <option value="">Wybierz historyjkę...</option>
                  @for (story of projectStories(); track story.id) {
                    <option [value]="story.id">{{ story.nazwa }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label for="nazwa">Nazwa</label>
                <input
                  type="text"
                  id="nazwa"
                  [(ngModel)]="formData.nazwa"
                  name="nazwa"
                  required
                  placeholder="Nazwa zadania"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="priorytet">Priorytet</label>
                <select id="priorytet" [(ngModel)]="formData.priorytet" name="priorytet">
                  <option value="niski">Niski</option>
                  <option value="sredni">Średni</option>
                  <option value="wysoki">Wysoki</option>
                </select>
              </div>

              <div class="form-group">
                <label for="czas">Przewidywany czas (h)</label>
                <input
                  type="number"
                  id="czas"
                  [(ngModel)]="formData.przewidywanyCzas"
                  name="przewidywanyCzas"
                  min="1"
                  value="1"
                />
              </div>

              @if (editingId()) {
                <div class="form-group">
                  <label for="stan">Stan</label>
                  <select id="stan" [(ngModel)]="formData.stan" name="stan">
                    <option value="todo">Do zrobienia</option>
                    <option value="doing">W trakcie</option>
                    <option value="done">Zrobione</option>
                  </select>
                </div>
              }
            </div>

            <div class="form-group">
              <label for="opis">Opis</label>
              <textarea
                id="opis"
                [(ngModel)]="formData.opis"
                name="opis"
                rows="2"
                placeholder="Opis zadania"
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
            Wszystkie ({{ filteredTasks().length }})
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

        <div class="tasks-list">
          @if (filteredTasks().length === 0) {
            <p class="empty-message">Brak zadań do wyświetlenia</p>
          } @else {
            @for (task of filteredTasks(); track task.id) {
              <div class="task-card" [class]="'priority-' + task.priorytet">
                <div class="task-header">
                  <h3>{{ task.nazwa }}</h3>
                  <span class="priority-badge" [class]="'priority-' + task.priorytet">
                    {{ getPriorityLabel(task.priorytet) }}
                  </span>
                </div>
                <p class="task-description">{{ task.opis || 'Brak opisu' }}</p>
                <div class="task-meta">
                  <span class="task-status" [class]="'status-' + task.stan">
                    {{ getStatusLabel(task.stan) }}
                  </span>
                  <span class="task-story">{{ getStoryName(task.storyId) }}</span>
                  <span class="task-time">{{ task.przewidywanyCzas }}h</span>
                </div>
                <div class="task-actions">
                  <a [routerLink]="['/tasks', task.id]" class="btn-details">Szczegóły</a>
                  <button class="btn-edit" (click)="editTask(task)">Edytuj</button>
                  <button class="btn-delete" (click)="deleteTask(task.id)">Usuń</button>
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

      .tasks-container {
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

      button,
      .btn-details {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 4px;
        font-size: 1rem;
        cursor: pointer;
        transition: background-color 0.2s;
        text-decoration: none;
        display: inline-block;
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

      .tasks-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .task-card {
        background: #fff;
        padding: 1.25rem;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        border-left: 4px solid #ddd;
      }
      .task-card.priority-niski {
        border-left-color: #28a745;
      }
      .task-card.priority-sredni {
        border-left-color: #ffc107;
      }
      .task-card.priority-wysoki {
        border-left-color: #dc3545;
      }

      .task-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
      }
      .task-header h3 {
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

      .task-description {
        color: #666;
        margin-bottom: 0.75rem;
      }

      .task-meta {
        display: flex;
        gap: 1rem;
        margin-bottom: 0.75rem;
        font-size: 0.875rem;
        flex-wrap: wrap;
      }

      .task-status {
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-weight: 500;
      }
      .task-status.status-todo {
        background: #e9ecef;
        color: #495057;
      }
      .task-status.status-doing {
        background: #cce5ff;
        color: #004085;
      }
      .task-status.status-done {
        background: #d4edda;
        color: #155724;
      }

      .task-story {
        color: #666;
      }
      .task-time {
        color: #666;
      }

      .task-actions {
        display: flex;
        gap: 0.5rem;
      }

      .btn-details {
        background: #17a2b8;
        color: white;
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
      }
      .btn-details:hover {
        background: #138496;
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
export class TasksComponent {
  taskStorage = inject(TaskStorageService);
  projectStorage = inject(ProjectStorageService);
  storyStorage = inject(StoryStorageService);
  userService = inject(UserService);

  activeFilter = signal<TaskStatus | 'all'>('all');
  editingId = signal<string | null>(null);

  formData = {
    storyId: '',
    nazwa: '',
    opis: '',
    priorytet: 'sredni' as TaskPriority,
    przewidywanyCzas: 1,
    stan: 'todo' as TaskStatus,
  };

  projectStories = computed(() => {
    const projectId = this.projectStorage.activeProject()?.id;
    return projectId ? this.storyStorage.getByProjectId(projectId) : [];
  });

  filteredTasks = computed(() => {
    const projectId = this.projectStorage.activeProject()?.id;
    if (!projectId) return [];

    const tasks = this.taskStorage.getByProjectId(projectId);
    const filter = this.activeFilter();

    if (filter === 'all') return tasks;
    return tasks.filter((t) => t.stan === filter);
  });

  getTodoCount(): number {
    const projectId = this.projectStorage.activeProject()?.id;
    if (!projectId) return 0;
    return this.taskStorage.getByProjectId(projectId).filter((t) => t.stan === 'todo').length;
  }

  getDoingCount(): number {
    const projectId = this.projectStorage.activeProject()?.id;
    if (!projectId) return 0;
    return this.taskStorage.getByProjectId(projectId).filter((t) => t.stan === 'doing').length;
  }

  getDoneCount(): number {
    const projectId = this.projectStorage.activeProject()?.id;
    if (!projectId) return 0;
    return this.taskStorage.getByProjectId(projectId).filter((t) => t.stan === 'done').length;
  }

  setFilter(filter: TaskStatus | 'all'): void {
    this.activeFilter.set(filter);
  }

  saveTask(): void {
    if (!this.formData.nazwa.trim() || !this.formData.storyId) return;

    const id = this.editingId();
    if (id) {
      this.taskStorage.update(id, this.formData);
    } else {
      this.taskStorage.create({
        ...this.formData,
        przypisanyUzytkownikId: null,
      });
    }

    this.resetForm();
  }

  editTask(task: Task): void {
    this.editingId.set(task.id);
    this.formData = {
      storyId: task.storyId,
      nazwa: task.nazwa,
      opis: task.opis,
      priorytet: task.priorytet,
      przewidywanyCzas: task.przewidywanyCzas,
      stan: task.stan,
    };
  }

  deleteTask(id: string): void {
    if (confirm('Czy na pewno chcesz usunąć to zadanie?')) {
      this.taskStorage.delete(id);
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
    this.formData = {
      storyId: '',
      nazwa: '',
      opis: '',
      priorytet: 'sredni',
      przewidywanyCzas: 1,
      stan: 'todo',
    };
  }

  getStoryName(storyId: string): string {
    const story = this.storyStorage.getById(storyId);
    return story ? story.nazwa : 'Nieznana';
  }

  getPriorityLabel(priority: TaskPriority): string {
    const labels: Record<TaskPriority, string> = {
      niski: 'Niski',
      sredni: 'Średni',
      wysoki: 'Wysoki',
    };
    return labels[priority];
  }

  getStatusLabel(status: TaskStatus): string {
    const labels: Record<TaskStatus, string> = {
      todo: 'Do zrobienia',
      doing: 'W trakcie',
      done: 'Zrobione',
    };
    return labels[status];
  }
}
