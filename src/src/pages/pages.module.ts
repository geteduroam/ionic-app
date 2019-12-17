import { NgModule } from '@angular/core';
import { IonicPageModule, NavController } from 'ionic-angular';
import { WelcomePage } from './welcome/welcome';

import { ErrorsPage } from './errors/errors';

import { ConfigurationScreen } from "./configScreen/configScreen";
import { WifiConfiguration} from "./wifiConfiguration/wifiConfiguration";
import { WifiConfirmation} from "./wifiConfirmation/wifiConfirmation";
import { FormsModule } from '@angular/forms';
import { ProfilePage } from './profile/profile';
import { Oauthflow } from './oauthflow/oauthflow';
import { ErrorHandlerProvider } from '../providers/error-handler/error-handler';

const Pages = [
  WelcomePage,
  ErrorsPage,
  ProfilePage,
  Oauthflow,
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
  providers: [
    FormsModule,
    ErrorHandlerProvider
  ]
})
export class PagesModule {}
