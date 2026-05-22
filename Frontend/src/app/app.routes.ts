import { Routes } from '@angular/router';
import { HomePageComponent } from './home/home-page/home-page.component';
import { SkillDemoPageComponent } from './skill/skill-demo-page/skill-demo-page.component';
import { SignInScreenComponent } from './auth/sign-in-screen/sign-in-screen.component';
import { RegisterScreenComponent } from './auth/register-screen/register-screen.component';
import { ForgotPasswordScreenComponent } from './auth/forgot-password-screen/forgot-password-screen.component';
import { AccountPageComponent } from './account/account-page/account-page.component';
import { WinnersPageComponent } from './winners/winners-page/winners-page.component';
import { CompetitionsPageComponent } from './competitions/competitions-page/competitions-page.component';
import { TiersPageComponent } from './tiers/tiers-page/tiers-page.component';
import { HowItWorksPageComponent } from './how-it-works/how-it-works-page/how-it-works-page.component';
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
  { path: 'competitions', component: CompetitionsPageComponent },
  { path: 'tiers', component: TiersPageComponent },
  { path: 'how-it-works', component: HowItWorksPageComponent },
  { path: 'winners', component: WinnersPageComponent },
  { path: 'skill', component: SkillDemoPageComponent },
  { path: '**', redirectTo: '' },
];