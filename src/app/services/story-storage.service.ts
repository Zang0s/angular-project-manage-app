import { Injectable, signal } from '@angular/core';
import { Story, StoryStatus } from '../models/story.model';
import { NotificationService } from './notification.service';

const STORAGE_KEY = 'manageme_stories';

@Injectable({
  providedIn: 'root',
})
export class StoryStorageService {
  private storiesSignal = signal<Story[]>([]);

  readonly stories = this.storiesSignal.asReadonly();

  constructor(private notificationService: NotificationService) {
    if (typeof localStorage !== 'undefined') {
      this.storiesSignal.set(this.loadFromStorage());
    }
  }

  private loadFromStorage(): Story[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveToStorage(stories: Story[]): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
    this.storiesSignal.set(stories);
  }

  getAll(): Story[] {
    return this.storiesSignal();
  }

  getByProjectId(projectId: string): Story[] {
    return this.storiesSignal().filter((s) => s.projektId === projectId);
  }

  getById(id: string): Story | undefined {
    return this.storiesSignal().find((s) => s.id === id);
  }

  getByProjectAndStatus(projectId: string, status: StoryStatus): Story[] {
    return this.storiesSignal().filter((s) => s.projektId === projectId && s.stan === status);
  }

  create(story: Omit<Story, 'id' | 'dataUtworzenia'>): Story {
    const newStory: Story = {
      ...story,
      id: crypto.randomUUID(),
      dataUtworzenia: new Date().toISOString(),
    };
    const stories = [...this.storiesSignal(), newStory];
    this.saveToStorage(stories);

    this.notificationService.send({
      title: 'Przypisanie do historyjki',
      message: `Przypisano Ci historyjkę "${newStory.nazwa}".`,
      priority: 'high',
      recipientId: newStory.wlascicielId,
    });

    return newStory;
  }

  update(id: string, updates: Partial<Omit<Story, 'id' | 'projektId'>>): Story | undefined {
    const stories = this.storiesSignal();
    const index = stories.findIndex((s) => s.id === id);
    if (index === -1) return undefined;

    const previous = stories[index];

    const updated = { ...stories[index], ...updates };
    stories[index] = updated;
    this.saveToStorage(stories);

    if (updates.wlascicielId && updates.wlascicielId !== previous.wlascicielId) {
      this.notificationService.send({
        title: 'Przypisanie do historyjki',
        message: `Przypisano Ci historyjkę "${updated.nazwa}".`,
        priority: 'high',
        recipientId: updates.wlascicielId,
      });
    }

    return updated;
  }

  delete(id: string): boolean {
    const stories = this.storiesSignal();
    const index = stories.findIndex((s) => s.id === id);
    if (index === -1) return false;

    stories.splice(index, 1);
    this.saveToStorage(stories);
    return true;
  }

  deleteByProjectId(projectId: string): void {
    const stories = this.storiesSignal().filter((s) => s.projektId !== projectId);
    this.saveToStorage(stories);
  }
}
