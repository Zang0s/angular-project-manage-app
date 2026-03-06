import { Routes } from '@angular/router';
import { ProjectsComponent } from './components/projects/projects.component';
import { StoriesComponent } from './components/stories/stories.component';

export const routes: Routes = [
  { path: '', component: StoriesComponent },
  { path: 'projects', component: ProjectsComponent },
];
