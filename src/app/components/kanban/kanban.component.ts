import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskStorageService } from '../../services/task-storage.service';
import { ProjectStorageService } from '../../services/project-storage.service';
import { StoryStorageService } from '../../services/story-storage.service';
import { UserService } from '../../services/user.service';
import { Task, TaskStatus } from '../../models/task.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-kanban',
  imports: [CommonModule, FormsModule],
  template: `
    @if (!projectStorage.activeProject()) {
      <div class="no-project">
        <p>Wybierz projekt, aby zobaczyć tablicę kanban</p>
      </div>
    } @else {
      <div class="kanban-container">
        <div class="kanban-header">
          <h1>Tablica Kanban</h1>
          <div class="filter-user">
            <label for="userFilter">Filtruj po osobie:</label>
            <select
              id="userFilter"
              [(ngModel)]="selectedUserId"
              (ngModelChange)="filterByUser($event)"
            >
              <option value="">Wszyscy</option>
              @for (user of availableUsers(); track user.id) {
                <option [value]="user.id">{{ user.imie }} {{ user.nazwisko }}</option>
              }
            </select>
          </div>
        </div>

        <div class="kanban-board">
          <div class="kanban-column">
            <div class="column-header todo">
              <h2>Do zrobienia</h2>
              <span class="count">{{ todoTasks().length }}</span>
            </div>
            <div class="column-content">
              @for (task of todoTasks(); track task.id) {
                <div class="task-card priority-{{ task.priorytet }}" (click)="goToDetails(task.id)">
                  <div class="task-title">{{ task.nazwa }}</div>
                  <div class="task-meta">
                    <span class="priority-tag priority-{{ task.priorytet }}">{{
                      getPriorityLabel(task.priorytet)
                    }}</span>
                    <span class="story-tag">{{ getStoryName(task.storyId) }}</span>
                  </div>
                  <div class="task-footer">
                    <span class="time">{{ task.przewidywanyCzas }}h</span>
                  </div>
                </div>
              }
              @if (todoTasks().length === 0) {
                <div class="empty-column">Brak zadań</div>
              }
            </div>
          </div>

          <div class="kanban-column">
            <div class="column-header doing">
              <h2>W trakcie</h2>
              <span class="count">{{ doingTasks().length }}</span>
            </div>
            <div class="column-content">
              @for (task of doingTasks(); track task.id) {
                <div class="task-card priority-{{ task.priorytet }}" (click)="goToDetails(task.id)">
                  <div class="task-title">{{ task.nazwa }}</div>
                  <div class="task-meta">
                    <span class="priority-tag priority-{{ task.priorytet }}">{{
                      getPriorityLabel(task.priorytet)
                    }}</span>
                    <span class="story-tag">{{ getStoryName(task.storyId) }}</span>
                  </div>
                  <div class="task-assignee">
                    @if (getUser(task.przypisanyUzytkownikId); as user) {
                      <span class="assignee">{{ user.imie }} {{ user.nazwisko }}</span>
                    }
                  </div>
                  <div class="task-footer">
                    <span class="time">{{ task.przewidywanyCzas }}h</span>
                    @if (task.dataStartu) {
                      <span class="started">{{ task.dataStartu | date: 'dd.MM' }}</span>
                    }
                  </div>
                </div>
              }
              @if (doingTasks().length === 0) {
                <div class="empty-column">Brak zadań</div>
              }
            </div>
          </div>

          <div class="kanban-column">
            <div class="column-header done">
              <h2>Zrobione</h2>
              <span class="count">{{ doneTasks().length }}</span>
            </div>
            <div class="column-content">
              @for (task of doneTasks(); track task.id) {
                <div class="task-card priority-{{ task.priorytet }}" (click)="goToDetails(task.id)">
                  <div class="task-title">{{ task.nazwa }}</div>
                  <div class="task-meta">
                    <span class="priority-tag priority-{{ task.priorytet }}">{{
                      getPriorityLabel(task.priorytet)
                    }}</span>
                    <span class="story-tag">{{ getStoryName(task.storyId) }}</span>
                  </div>
                  <div class="task-assignee">
                    @if (getUser(task.przypisanyUzytkownikId); as user) {
                      <span class="assignee">{{ user.imie }} {{ user.nazwisko }}</span>
                    }
                  </div>
                  <div class="task-footer">
                    <span class="time"
                      >{{ task.zrealizowaneRoboczogodziny }}h / {{ task.przewidywanyCzas }}h</span
                    >
                    @if (task.dataZakonczenia) {
                      <span class="finished">{{ task.dataZakonczenia | date: 'dd.MM' }}</span>
                    }
                  </div>
                </div>
              }
              @if (doneTasks().length === 0) {
                <div class="empty-column">Brak zadań</div>
              }
            </div>
          </div>
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

      .kanban-container {
        padding: 1rem 2rem;
      }

      .kanban-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
      }
      .kanban-header h1 {
        margin: 0;
        color: #333;
      }

      .filter-user {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .filter-user label {
        color: #666;
      }
      .filter-user select {
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
      }

      .kanban-board {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        min-height: calc(100vh - 200px);
      }

      .kanban-column {
        background: #f5f5f5;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
      }

      .column-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-radius: 8px 8px 0 0;
        color: white;
      }
      .column-header.todo {
        background: #6c757d;
      }
      .column-header.doing {
        background: #007bff;
      }
      .column-header.done {
        background: #28a745;
      }
      .column-header h2 {
        margin: 0;
        font-size: 1rem;
      }
      .count {
        background: rgba(255, 255, 255, 0.2);
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        font-size: 0.875rem;
      }

      .column-content {
        flex: 1;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        overflow-y: auto;
      }

      .task-card {
        background: #fff;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        cursor: pointer;
        transition:
          transform 0.2s,
          box-shadow 0.2s;
        border-left: 4px solid #ddd;
      }
      .task-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
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

      .task-title {
        font-weight: 600;
        color: #333;
        margin-bottom: 0.5rem;
      }

      .task-meta {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
        flex-wrap: wrap;
      }

      .priority-tag {
        padding: 0.125rem 0.5rem;
        border-radius: 4px;
        font-size: 0.7rem;
        font-weight: 600;
      }
      .priority-tag.priority-niski {
        background: #d4edda;
        color: #155724;
      }
      .priority-tag.priority-sredni {
        background: #fff3cd;
        color: #856404;
      }
      .priority-tag.priority-wysoki {
        background: #f8d7da;
        color: #721c24;
      }

      .story-tag {
        padding: 0.125rem 0.5rem;
        border-radius: 4px;
        font-size: 0.7rem;
        background: #e9ecef;
        color: #495057;
      }

      .task-assignee {
        margin-bottom: 0.5rem;
      }
      .assignee {
        font-size: 0.8rem;
        color: #007bff;
        font-weight: 500;
      }

      .task-footer {
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;
        color: #666;
      }

      .empty-column {
        text-align: center;
        padding: 2rem;
        color: #999;
        font-style: italic;
      }

      @media (max-width: 900px) {
        .kanban-board {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class KanbanComponent {
  taskStorage = inject(TaskStorageService);
  projectStorage = inject(ProjectStorageService);
  storyStorage = inject(StoryStorageService);
  userService = inject(UserService);

  selectedUserId = '';

  availableUsers = computed(() => this.userService.getDevelopersAndDevops());

  private projectTasks = computed(() => {
    const projectId = this.projectStorage.activeProject()?.id;
    return projectId ? this.taskStorage.getByProjectId(projectId) : [];
  });

  private filteredTasks = computed(() => {
    const tasks = this.projectTasks();
    if (!this.selectedUserId) return tasks;
    return tasks.filter((t) => t.przypisanyUzytkownikId === this.selectedUserId);
  });

  todoTasks = computed(() => this.filteredTasks().filter((t) => t.stan === 'todo'));
  doingTasks = computed(() => this.filteredTasks().filter((t) => t.stan === 'doing'));
  doneTasks = computed(() => this.filteredTasks().filter((t) => t.stan === 'done'));

  filterByUser(userId: string): void {
    this.selectedUserId = userId;
  }

  goToDetails(taskId: string): void {
    window.location.href = `/tasks/${taskId}`;
  }

  getStoryName(storyId: string): string {
    const story = this.storyStorage.getById(storyId);
    return story ? story.nazwa : '?';
  }

  getUser(userId: string | null): User | null {
    return userId ? this.userService.getById(userId) || null : null;
  }

  getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = { niski: 'Niski', sredni: 'Średni', wysoki: 'Wysoki' };
    return labels[priority] || priority;
  }
}
