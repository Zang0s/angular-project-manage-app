import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectStorageService } from '../../services/project-storage.service';
import { Project } from '../../models/project.model';

@Component({
  selector: 'app-projects',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <h1>Projekty</h1>

      <div class="form-card">
        <h2>{{ editingId() ? 'Edytuj projekt' : 'Dodaj nowy projekt' }}</h2>
        <form (ngSubmit)="saveProject()">
          <div class="form-group">
            <label for="nazwa">Nazwa</label>
            <input
              type="text"
              id="nazwa"
              [(ngModel)]="formData.nazwa"
              name="nazwa"
              required
              placeholder="Wprowadź nazwę projektu"
            />
          </div>

          <div class="form-group">
            <label for="opis">Opis</label>
            <textarea
              id="opis"
              [(ngModel)]="formData.opis"
              name="opis"
              rows="3"
              placeholder="Wprowadź opis projektu"
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

      <div class="projects-list">
        <h2>Lista projektów</h2>

        @if (storage.projects().length === 0) {
          <p class="empty-message">Brak projektów. Dodaj pierwszy projekt.</p>
        } @else {
          <div class="project-grid">
            @for (project of storage.projects(); track project.id) {
              <div class="project-card">
                <h3>{{ project.nazwa }}</h3>
                <p>{{ project.opis || 'Brak opisu' }}</p>
                <div class="project-actions">
                  <button class="btn-edit" (click)="editProject(project)">Edytuj</button>
                  <button class="btn-delete" (click)="deleteProject(project.id)">Usuń</button>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem;
      }

      h1 {
        margin-bottom: 2rem;
        color: #333;
      }

      h2 {
        margin-bottom: 1rem;
        color: #555;
        font-size: 1.25rem;
      }

      .form-card {
        background: #fff;
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        margin-bottom: 2rem;
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
      textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
        font-family: inherit;
      }

      input:focus,
      textarea:focus {
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

      .empty-message {
        color: #666;
        font-style: italic;
      }

      .project-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1rem;
      }

      .project-card {
        background: #fff;
        padding: 1.25rem;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .project-card h3 {
        margin: 0 0 0.5rem;
        color: #333;
      }

      .project-card p {
        color: #666;
        margin-bottom: 1rem;
      }

      .project-actions {
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
    `,
  ],
})
export class ProjectsComponent {
  storage = inject(ProjectStorageService);

  editingId = signal<string | null>(null);
  formData = { nazwa: '', opis: '' };

  saveProject(): void {
    if (!this.formData.nazwa.trim()) return;

    const id = this.editingId();
    if (id) {
      this.storage.update(id, this.formData as Partial<Omit<Project, 'id'>>);
    } else {
      this.storage.create(this.formData);
    }

    this.resetForm();
  }

  editProject(project: Project): void {
    this.editingId.set(project.id);
    this.formData = { nazwa: project.nazwa, opis: project.opis };
  }

  deleteProject(id: string): void {
    if (confirm('Czy na pewno chcesz usunąć ten projekt?')) {
      this.storage.delete(id);
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
    this.formData = { nazwa: '', opis: '' };
  }
}
