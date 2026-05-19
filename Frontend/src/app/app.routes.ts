import { Routes } from '@angular/router';
import { HomePageComponent } from './home/home-page/home-page.component';
import { SkillDemoPageComponent } from './skill/skill-demo-page/skill-demo-page.component';

export const routes: Routes = [
  { path: '', component: HomePageComponent, pathMatch: 'full' },
  { path: 'skill', component: SkillDemoPageComponent },
  { path: '**', redirectTo: '' },
];
