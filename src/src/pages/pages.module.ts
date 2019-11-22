import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { WelcomePage } from './welcome/welcome';
import { ConfirmPage } from './confirm/confirm';
import { ErrorsPage } from './errors/errors';
import { InstitutionPage } from './institution/institution';
import { ProfilePage } from './profile/profile';

const Pages = [
  WelcomePage,
  InstitutionPage,
  ProfilePage,
  ConfirmPage,
  ErrorsPage
];

@NgModule({
  declarations: [
    Pages,
  ],
  imports: [
    IonicPageModule.forChild(Pages),
  ],
})
export class PagesModule {}
