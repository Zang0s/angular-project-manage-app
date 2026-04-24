import { Injectable, signal } from '@angular/core';
import { Task, TaskStatus } from '../models/task.model';
import { StoryStorageService } from './story-storage.service';
import { NotificationService } from './notification.service';
import { DataStorageService } from './data-storage.service';

const STORAGE_KEY = 'manageme_tasks';

@Injectable({
  providedIn: 'root',
})
export class TaskStorageService {
  private tasksSignal = signal<Task[]>([]);
  private initializedSignal = signal(false);
  private initPromise: Promise<void> | null = null;

  readonly tasks = this.tasksSignal.asReadonly();
  readonly initialized = this.initializedSignal.asReadonly();

  constructor(
    private storyStorage: StoryStorageService,
    private notificationService: NotificationService,
    private dataStorage: DataStorageService,
  ) {
    if (this.dataStorage.isClient()) {
      this.initPromise = this.initialize();
    } else {
      this.initializedSignal.set(true);
    }
  }

  async ensureInitialized(): Promise<void> {
    if (this.initializedSignal()) return;
    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = this.initialize();
    await this.initPromise;
  }

  private async initialize(): Promise<void> {
    this.tasksSignal.set(await this.loadFromStorage());
    this.initializedSignal.set(true);
  }

  private async loadFromStorage(): Promise<Task[]> {
    return this.dataStorage.read<Task[]>(STORAGE_KEY, []);
  }

  private saveToStorage(tasks: Task[]): void {
    this.tasksSignal.set(tasks);
    void this.dataStorage.write(STORAGE_KEY, tasks);
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

    this.notifyStoryOwner(
      newTask.storyId,
      'Nowe zadanie w historyjce',
      `Dodano zadanie "${newTask.nazwa}".`,
      'medium',
    );

    return newTask;
  }

  update(id: string, updates: Partial<Omit<Task, 'id' | 'dataDodania'>>): Task | undefined {
    const tasks = this.tasksSignal();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return undefined;

    const previous = tasks[index];
    const next = { ...previous, ...updates };

    if (previous.stan !== next.stan) {
      if (next.stan === 'doing' && !next.dataStartu) {
        next.dataStartu = new Date().toISOString();
      }

      if (next.stan === 'done' && !next.dataZakonczenia) {
        next.dataZakonczenia = new Date().toISOString();
      }
    }

    const updatedTasks = [...tasks];
    updatedTasks[index] = next;
    this.saveToStorage(updatedTasks);

    if (previous.stan !== next.stan) {
      if (next.stan === 'doing') {
        this.updateStoryIfNeeded(next.storyId, 'doing');
        this.notifyStoryOwner(
          next.storyId,
          'Zmiana statusu zadania',
          `Zadanie "${next.nazwa}" zmieniło status na "doing".`,
          'low',
        );
      }

      if (next.stan === 'done') {
        this.notifyStoryOwner(
          next.storyId,
          'Zmiana statusu zadania',
          `Zadanie "${next.nazwa}" zmieniło status na "done".`,
          'medium',
        );
        this.checkAndCloseStory(next.storyId);
      }
    }

    return next;
  }

  assignUser(taskId: string, userId: string): Task | undefined {
    const task = this.getById(taskId);
    if (!task || task.stan !== 'todo') return undefined;

    const updated = this.update(taskId, {
      przypisanyUzytkownikId: userId,
      stan: 'doing',
      dataStartu: new Date().toISOString(),
    });

    if (updated) {
      this.notificationService.send({
        title: 'Przypisanie do zadania',
        message: `Przypisano Ci zadanie "${updated.nazwa}".`,
        priority: 'high',
        recipientId: userId,
      });
    }

    return updated;
  }

  completeTask(taskId: string): Task | undefined {
    const task = this.getById(taskId);
    if (!task || task.stan !== 'doing') return undefined;

    return this.update(taskId, {
      stan: 'done',
      dataZakonczenia: new Date().toISOString(),
    });
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

    const removed = tasks[index];
    const updated = [...tasks.slice(0, index), ...tasks.slice(index + 1)];
    this.saveToStorage(updated);

    this.notifyStoryOwner(
      removed.storyId,
      'Usunięcie zadania z historyjki',
      `Usunięto zadanie "${removed.nazwa}".`,
      'medium',
    );

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

  private notifyStoryOwner(
    storyId: string,
    title: string,
    message: string,
    priority: 'low' | 'medium' | 'high',
  ): void {
    const story = this.storyStorage.getById(storyId);
    if (!story) return;

    this.notificationService.send({
      title,
      message,
      priority,
      recipientId: story.wlascicielId,
    });
  }
}
