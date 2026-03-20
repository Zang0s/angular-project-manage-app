import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TaskStorageService } from '../../services/task-storage.service';
import { StoryStorageService } from '../../services/story-storage.service';
import { UserService } from '../../services/user.service';
import { Task, TaskPriority, TaskStatus } from '../../models/task.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-task-details',
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    @if (loading()) {
      <div class="loading">Ładowanie...</div>
    } @else if (!task()) {
      <div class="not-found">
        <p>Zadanie nie zostało znalezione</p>
        <a routerLink="/tasks" class="btn-back">Powrót do listy</a>
      </div>
    } @else {
      <div class="details-container">
        <div class="details-header">
          <h1>{{ task()!.nazwa }}</h1>
          <span class="priority-badge" [class]="'priority-' + task()!.priorytet">
            {{ getPriorityLabel(task()!.priorytet) }}
          </span>
        </div>

        <div class="details-content">
          <div class="details-grid">
            <div class="detail-card">
              <h3>Opis</h3>
              <p>{{ task()!.opis || 'Brak opisu' }}</p>
            </div>

            <div class="detail-card">
              <h3>Status</h3>
              <span class="status-badge" [class]="'status-' + task()!.stan">
                {{ getStatusLabel(task()!.stan) }}
              </span>
            </div>

            <div class="detail-card">
              <h3>Historyjka</h3>
              @if (story()) {
                <p>{{ story()!.nazwa }}</p>
                <small class="story-status" [class]="'status-' + story()!.stan">
                  {{ getStoryStatusLabel(story()!.stan) }}
                </small>
              } @else {
                <p class="not-assigned">Nieprzypisana</p>
              }
            </div>

            <div class="detail-card">
              <h3>Przewidywany czas</h3>
              <p>{{ task()!.przewidywanyCzas }} godzin</p>
            </div>

            <div class="detail-card">
              <h3>Zrealizowane roboczogodziny</h3>
              <p>{{ task()!.zrealizowaneRoboczogodziny }} godzin</p>
            </div>

            <div class="detail-card">
              <h3>Przypisana osoba</h3>
              @if (assignedUser()) {
                <p>{{ assignedUser()!.imie }} {{ assignedUser()!.nazwisko }}</p>
                <small class="role-badge">{{ getRoleLabel(assignedUser()!.rola) }}</small>
              } @else {
                <p class="not-assigned">Nieprzypisana</p>
              }
            </div>

            <div class="detail-card">
              <h3>Data dodania</h3>
              <p>{{ task()!.dataDodania | date: 'dd.MM.yyyy HH:mm' }}</p>
            </div>

            <div class="detail-card">
              <h3>Data startu</h3>
              @if (task()!.dataStartu) {
                <p>{{ task()!.dataStartu | date: 'dd.MM.yyyy HH:mm' }}</p>
              } @else {
                <p class="not-assigned">Nie rozpoczęto</p>
              }
            </div>

            <div class="detail-card">
              <h3>Data zakończenia</h3>
              @if (task()!.dataZakonczenia) {
                <p>{{ task()!.dataZakonczenia | date: 'dd.MM.yyyy HH:mm' }}</p>
              } @else {
                <p class="not-assigned">Nie zakończono</p>
              }
            </div>
          </div>

          <div class="actions-section">
            @if (task()!.stan === 'todo') {
              <div class="action-card">
                <h3>Przypisz osobę do zadania</h3>
                <p>Przypisanie automatycznie zmieni status na "W trakcie" i ustawi datę startu.</p>
                <div class="assign-form">
                  <select [(ngModel)]="selectedUserId" name="userId">
                    <option value="">Wybierz osobę...</option>
                    @for (user of availableUsers(); track user.id) {
                      <option [value]="user.id">
                        {{ user.imie }} {{ user.nazwisko }} ({{ getRoleLabel(user.rola) }})
                      </option>
                    }
                  </select>
                  <button class="btn-assign" (click)="assignUser()" [disabled]="!selectedUserId">
                    Przypisz
                  </button>
                </div>
              </div>
            }

            @if (task()!.stan === 'doing') {
              <div class="action-card">
                <h3>Zamknij zadanie</h3>
                <p>Zamknięcie zadania ustawi status na "Zrobione" i datę zakończenia.</p>
                <div class="form-group">
                  <label for="hours">Zrealizowane roboczogodziny</label>
                  <input type="number" id="hours" [(ngModel)]="workedHours" min="0" step="0.5" />
                </div>
                <button class="btn-complete" (click)="completeTask()">Zamknij zadanie</button>
              </div>
            }

            @if (task()!.stan === 'done') {
              <div class="action-card completed">
                <h3>Zadanie zakończone</h3>
                <p>
                  Zadanie zostało pomyślnie ukończone
                  {{ task()!.dataZakonczenia | date: 'dd.MM.yyyy HH:mm' }}.
                </p>
              </div>
            }
          </div>
        </div>

        <div class="details-footer">
          <a routerLink="/tasks" class="btn-back">Powrót do listy</a>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .loading,
      .not-found {
        text-align: center;
        padding: 3rem;
      }

      .details-container {
        max-width: 900px;
        margin: 0 auto;
        padding: 2rem;
      }

      .details-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
      }
      .details-header h1 {
        margin: 0;
        color: #333;
      }

      .priority-badge {
        padding: 0.5rem 1rem;
        border-radius: 4px;
        font-size: 0.875rem;
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

      .details-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
      }

      .detail-card {
        background: #fff;
        padding: 1.25rem;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
      .detail-card h3 {
        margin: 0 0 0.5rem;
        color: #666;
        font-size: 0.875rem;
        text-transform: uppercase;
      }
      .detail-card p {
        margin: 0;
        color: #333;
      }

      .not-assigned {
        color: #999;
        font-style: italic;
      }

      .status-badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 4px;
        font-weight: 500;
      }
      .status-badge.status-todo {
        background: #e9ecef;
        color: #495057;
      }
      .status-badge.status-doing {
        background: #cce5ff;
        color: #004085;
      }
      .status-badge.status-done {
        background: #d4edda;
        color: #155724;
      }

      .story-status {
        display: block;
        margin-top: 0.5rem;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
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

      .role-badge {
        display: inline-block;
        margin-top: 0.25rem;
        padding: 0.125rem 0.5rem;
        background: #e9ecef;
        border-radius: 4px;
        font-size: 0.75rem;
      }

      .actions-section {
        margin-bottom: 2rem;
      }

      .action-card {
        background: #fff;
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        margin-bottom: 1rem;
      }
      .action-card h3 {
        margin: 0 0 0.5rem;
        color: #333;
      }
      .action-card p {
        color: #666;
        margin-bottom: 1rem;
      }
      .action-card.completed {
        background: #d4edda;
      }
      .action-card.completed h3 {
        color: #155724;
      }
      .action-card.completed p {
        color: #155724;
      }

      .assign-form {
        display: flex;
        gap: 1rem;
        align-items: flex-end;
      }
      .assign-form select {
        flex: 1;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
      }

      .form-group {
        margin-bottom: 1rem;
      }
      .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
      }
      .form-group input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
      }

      button {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 4px;
        font-size: 1rem;
        cursor: pointer;
      }
      button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .btn-assign {
        background: #007bff;
        color: white;
      }
      .btn-assign:hover:not(:disabled) {
        background: #0056b3;
      }
      .btn-complete {
        background: #28a745;
        color: white;
      }
      .btn-complete:hover {
        background: #1e7e34;
      }

      .details-footer {
        text-align: center;
      }
      .btn-back {
        display: inline-block;
        padding: 0.75rem 1.5rem;
        background: #6c757d;
        color: white;
        text-decoration: none;
        border-radius: 4px;
      }
      .btn-back:hover {
        background: #545b62;
      }
    `,
  ],
})
export class TaskDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  taskStorage = inject(TaskStorageService);
  storyStorage = inject(StoryStorageService);
  userService = inject(UserService);

  loading = signal(true);
  task = signal<Task | null>(null);
  selectedUserId = '';
  workedHours = 0;

  story = computed(() => {
    const t = this.task();
    return t ? this.storyStorage.getById(t.storyId) : null;
  });

  assignedUser = computed(() => {
    const t = this.task();
    return t?.przypisanyUzytkownikId ? this.userService.getById(t.przypisanyUzytkownikId) : null;
  });

  availableUsers = computed(() => this.userService.getDevelopersAndDevops());

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const t = this.taskStorage.getById(id);
      this.task.set(t || null);
      if (t) {
        this.workedHours = t.zrealizowaneRoboczogodziny;
      }
    }
    this.loading.set(false);
  }

  assignUser(): void {
    const t = this.task();
    if (!t || !this.selectedUserId) return;

    this.taskStorage.assignUser(t.id, this.selectedUserId);
    const updated = this.taskStorage.getById(t.id);
    this.task.set(updated || null);
    this.selectedUserId = '';
  }

  completeTask(): void {
    const t = this.task();
    if (!t) return;

    this.taskStorage.update(t.id, { zrealizowaneRoboczogodziny: this.workedHours });
    this.taskStorage.completeTask(t.id);
    const updated = this.taskStorage.getById(t.id);
    this.task.set(updated || null);
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

  getStoryStatusLabel(status: TaskStatus): string {
    const labels: Record<TaskStatus, string> = {
      todo: 'Do zrobienia',
      doing: 'W trakcie',
      done: 'Zrobione',
    };
    return labels[status];
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
