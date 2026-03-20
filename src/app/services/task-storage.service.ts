import { Injectable, signal } from '@angular/core';
import { Task, TaskPriority, TaskStatus } from '../models/task.model';
import { StoryStorageService } from './story-storage.service';

const STORAGE_KEY = 'manageme_tasks';

@Injectable({
  providedIn: 'root',
})
export class TaskStorageService {
  private tasksSignal = signal<Task[]>([]);

  readonly tasks = this.tasksSignal.asReadonly();

  constructor(private storyStorage: StoryStorageService) {
    if (typeof localStorage !== 'undefined') {
      this.tasksSignal.set(this.loadFromStorage());
    }
  }

  private loadFromStorage(): Task[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveToStorage(tasks: Task[]): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    this.tasksSignal.set(tasks);
  }

  getAll(): Task[] {
    return this.tasksSignal();
  }

  getById(id: string): Task | undefined {
    return this.tasksSignal().find((t) => t.id === id);
  }

  getByStoryId(storyId: string): Task[] {
    return this.tasksSignal().filter((t) => t.storyId === storyId);
  }

  getByProjectId(projectId: string): Task[] {
    const stories = this.storyStorage.getByProjectId(projectId);
    const storyIds = stories.map((s) => s.id);
    return this.tasksSignal().filter((t) => storyIds.includes(t.storyId));
  }

  getByStatus(status: TaskStatus): Task[] {
    return this.tasksSignal().filter((t) => t.stan === status);
  }

  create(
    task: Omit<
      Task,
      'id' | 'dataDodania' | 'dataStartu' | 'dataZakonczenia' | 'zrealizowaneRoboczogodziny'
    >,
  ): Task {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      dataDodania: new Date().toISOString(),
      dataStartu: null,
      dataZakonczenia: null,
      zrealizowaneRoboczogodziny: 0,
    };
    const tasks = [...this.tasksSignal(), newTask];
    this.saveToStorage(tasks);
    return newTask;
  }

  update(id: string, updates: Partial<Omit<Task, 'id' | 'dataDodania'>>): Task | undefined {
    const tasks = this.tasksSignal();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return undefined;

    const updated = { ...tasks[index], ...updates };
    tasks[index] = updated;
    this.saveToStorage(tasks);
    return updated;
  }

  assignUser(taskId: string, userId: string): Task | undefined {
    const task = this.getById(taskId);
    if (!task || task.stan !== 'todo') return undefined;

    const now = new Date().toISOString();
    const updated = this.update(taskId, {
      przypisanyUzytkownikId: userId,
      stan: 'doing',
      dataStartu: now,
    });

    if (updated) {
      this.updateStoryIfNeeded(updated.storyId, 'doing');
    }

    return updated;
  }

  completeTask(taskId: string): Task | undefined {
    const task = this.getById(taskId);
    if (!task || task.stan !== 'doing') return undefined;

    const now = new Date().toISOString();
    const updated = this.update(taskId, {
      stan: 'done',
      dataZakonczenia: now,
    });

    if (updated) {
      this.checkAndCloseStory(updated.storyId);
    }

    return updated;
  }

  private updateStoryIfNeeded(storyId: string, newStatus: 'doing' | 'done'): void {
    const story = this.storyStorage.getById(storyId);
    if (story && story.stan === 'todo') {
      this.storyStorage.update(storyId, { stan: newStatus });
    }
  }

  private checkAndCloseStory(storyId: string): void {
    const storyTasks = this.getByStoryId(storyId);
    const allDone = storyTasks.length > 0 && storyTasks.every((t) => t.stan === 'done');

    if (allDone) {
      this.storyStorage.update(storyId, { stan: 'done' });
    }
  }

  delete(id: string): boolean {
    const tasks = this.tasksSignal();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return false;

    tasks.splice(index, 1);
    this.saveToStorage(tasks);
    return true;
  }

  deleteByStoryId(storyId: string): void {
    const tasks = this.tasksSignal().filter((t) => t.storyId !== storyId);
    this.saveToStorage(tasks);
  }

  deleteByProjectId(projectId: string): void {
    const stories = this.storyStorage.getByProjectId(projectId);
    const storyIds = stories.map((s) => s.id);
    const tasks = this.tasksSignal().filter((t) => !storyIds.includes(t.storyId));
    this.saveToStorage(tasks);
  }
}
