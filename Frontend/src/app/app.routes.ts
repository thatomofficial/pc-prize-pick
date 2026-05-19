import { Routes } from '@angular/router';
import { HomePageComponent } from './home/home-page/home-page.component';
import { SkillDemoPageComponent } from './skill/skill-demo-page/skill-demo-page.component';
import { SignInScreenComponent } from './auth/sign-in-screen/sign-in-screen.component';
import { RegisterScreenComponent } from './auth/register-screen/register-screen.component';
import { ForgotPasswordScreenComponent } from './auth/forgot-password-screen/forgot-password-screen.component';
import { AccountPageComponent } from './account/account-page/account-page.component';
import { authGuard, guestGuard } from './_shared/guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomePageComponent, pathMatch: 'full' },
  { path: 'login', component: SignInScreenComponent, canActivate: [guestGuard] },
  { path: 'register', component: RegisterScreenComponent, canActivate: [guestGuard] },
  {
    path: 'forgot-password',
    component: ForgotPasswordScreenComponent,
    canActivate: [guestGuard],
  },
  { path: 'account', component: AccountPageComponent, canActivate: [authGuard] },
  { path: 'skill', component: SkillDemoPageComponent },
  { path: '**', redirectTo: '' },
];
