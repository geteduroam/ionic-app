import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { WelcomePage } from './welcome/welcome';
import { ConfirmPage } from './confirm/confirm';
import { ErrorsPage } from './errors/errors';
import { InstitutionPage } from './institution/institution';
import { ProfilePage } from './profile/profile';
import { ConfigPage } from './config/config';
import { AuthPage } from './auth/auth';
import { CatflowPage } from './catflow/catflow';
import { ConfigurationScreen } from "./configScreen/configScreen";
import { WifiConfiguration} from "./wifiConfiguration/wifiConfiguration";
import { WifiConfirmation} from "./wifiConfirmation/wifiConfirmation";


const Pages = [
  WelcomePage,
  InstitutionPage,
  ProfilePage,
  ConfirmPage,
  ConfigPage,
  AuthPage,
  CatflowPage,
  ErrorsPage,
  ConfigurationScreen,
  WifiConfiguration,
  WifiConfirmation
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
