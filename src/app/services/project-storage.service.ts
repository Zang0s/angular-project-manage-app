import { Injectable, signal, computed } from '@angular/core';
import { Project } from '../models/project.model';
import { UserService } from './user.service';
import { NotificationService } from './notification.service';
import { DataStorageService } from './data-storage.service';

const STORAGE_KEY = 'manageme_projects';
const ACTIVE_PROJECT_KEY = 'manageme_active_project';

@Injectable({
  providedIn: 'root',
})
export class ProjectStorageService {
  private projectsSignal = signal<Project[]>([]);
  private activeProjectIdSignal = signal<string | null>(null);

  readonly projects = this.projectsSignal.asReadonly();
  readonly activeProjectId = this.activeProjectIdSignal.asReadonly();

  readonly activeProject = computed(() => {
    const id = this.activeProjectIdSignal();
    return id ? this.projectsSignal().find((p) => p.id === id) : undefined;
  });

  constructor(
    private userService: UserService,
    private notificationService: NotificationService,
    private dataStorage: DataStorageService,
  ) {
    if (this.dataStorage.isClient()) {
      void this.initialize();
    }
  }

  private async initialize(): Promise<void> {
    this.projectsSignal.set(await this.loadFromStorage());
    this.activeProjectIdSignal.set(await this.loadActiveProjectId());
  }

  private async loadFromStorage(): Promise<Project[]> {
    return this.dataStorage.read<Project[]>(STORAGE_KEY, []);
  }

  private async loadActiveProjectId(): Promise<string | null> {
    return this.dataStorage.read<string | null>(ACTIVE_PROJECT_KEY, null);
  }

  private saveToStorage(projects: Project[]): void {
    this.projectsSignal.set(projects);
    void this.dataStorage.write(STORAGE_KEY, projects);
  }

  private saveActiveProjectId(id: string | null): void {
    this.activeProjectIdSignal.set(id);
    if (id) {
      void this.dataStorage.write(ACTIVE_PROJECT_KEY, id);
    } else {
      void this.dataStorage.remove(ACTIVE_PROJECT_KEY);
    }
  }

  getAll(): Project[] {
    return this.projects();
  }

  getById(id: string): Project | undefined {
    return this.projects().find((p) => p.id === id);
  }

  create(project: Omit<Project, 'id'>): Project {
    const newProject: Project = {
      ...project,
      id: crypto.randomUUID(),
    };
    const projects = [...this.projects(), newProject];
    this.saveToStorage(projects);

    const admins = this.userService.getByRole('admin');
    this.notificationService.sendMany(
      admins.map((admin) => ({
        title: 'Utworzono nowy projekt',
        message: `Projekt "${newProject.nazwa}" został utworzony.`,
        priority: 'high' as const,
        recipientId: admin.id,
      })),
    );

    return newProject;
  }

  update(id: string, updates: Partial<Omit<Project, 'id'>>): Project | undefined {
    const projects = this.projects();
    const index = projects.findIndex((p) => p.id === id);
    if (index === -1) return undefined;

    const updated = { ...projects[index], ...updates };
    projects[index] = updated;
    this.saveToStorage(projects);
    return updated;
  }

  delete(id: string): boolean {
    const projects = this.projectsSignal();
    const index = projects.findIndex((p) => p.id === id);
    if (index === -1) return false;

    projects.splice(index, 1);
    this.saveToStorage(projects);

    if (this.activeProjectIdSignal() === id) {
      this.clearActiveProject();
    }
    return true;
  }

  setActiveProject(id: string | null): void {
    this.saveActiveProjectId(id);
  }

  clearActiveProject(): void {
    this.saveActiveProjectId(null);
  }
}
