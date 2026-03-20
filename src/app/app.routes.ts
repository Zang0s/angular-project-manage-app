import { Routes } from '@angular/router';
import { ProjectsComponent } from './components/projects/projects.component';
import { StoriesComponent } from './components/stories/stories.component';
import { TasksComponent } from './components/tasks/tasks.component';
import { TaskDetailsComponent } from './components/task-details/task-details.component';
import { KanbanComponent } from './components/kanban/kanban.component';

export const routes: Routes = [
  { path: '', component: StoriesComponent },
  { path: 'projects', component: ProjectsComponent },
  { path: 'tasks', component: TasksComponent },
  { path: 'tasks/:id', component: TaskDetailsComponent },
  { path: 'kanban', component: KanbanComponent },
];
