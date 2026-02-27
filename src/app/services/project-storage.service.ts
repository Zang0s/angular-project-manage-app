import { Injectable, signal } from '@angular/core';
import { Project } from '../models/project.model';

const STORAGE_KEY = 'manageme_projects';

@Injectable({
  providedIn: 'root',
})
export class ProjectStorageService {
  private projectsSignal = signal<Project[]>([]);

  readonly projects = this.projectsSignal.asReadonly();

  constructor() {
    if (typeof localStorage !== 'undefined') {
      this.projectsSignal.set(this.loadFromStorage());
    }
  }

  private loadFromStorage(): Project[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveToStorage(projects: Project[]): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    this.projectsSignal.set(projects);
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
    const projects = this.projects();
    const index = projects.findIndex((p) => p.id === id);
    if (index === -1) return false;

    projects.splice(index, 1);
    this.saveToStorage(projects);
    return true;
  }
}
